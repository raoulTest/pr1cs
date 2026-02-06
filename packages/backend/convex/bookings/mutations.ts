/**
 * Booking Mutations
 * Create, update, and manage booking lifecycle
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  isPortAdmin,
  isCarrier,
  canManageTerminal,
  canViewCarrier,
  canModifyBookingStatus,
  requireBookingView,
} from "../lib/permissions";
import {
  bookingInputValidator,
  bookingStatusValidator,
  isValidStatusTransition,
  type BookingStatus,
} from "../lib/validators";
import {
  checkAndReserveCapacity,
  releaseCapacity,
} from "../lib/capacity";
import {
  generateBookingReference,
  generateQRCodePlaceholder,
  validateTruckForGate,
  getSystemConfig,
  canCancelBooking,
} from "./internal";
import { internal } from "../_generated/api";

// ============================================================================
// CREATE BOOKING
// ============================================================================

/**
 * Create a new booking
 * Carriers create bookings for their own trucks
 */
export const create = mutation({
  args: bookingInputValidator.fields,
  returns: v.id("bookings"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    if (!user.carrierCompanyId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You must be associated with a carrier company to create bookings",
      });
    }

    // 1. Validate time slot exists and is active
    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Time slot not found",
      });
    }
    if (!timeSlot.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Time slot is not available for booking",
      });
    }

    // 2. Validate time slot is in the future
    const slotDateTime = new Date(`${timeSlot.date}T${timeSlot.startTime}`);
    const now = new Date();
    if (slotDateTime <= now) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Cannot book a time slot in the past",
      });
    }

    // 3. Check system config for advance booking rules
    const config = await getSystemConfig(ctx);
    const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilSlot < config.minAdvanceBookingHours) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Bookings must be made at least ${config.minAdvanceBookingHours} hours in advance`,
      });
    }

    const daysUntilSlot = hoursUntilSlot / 24;
    if (daysUntilSlot > config.maxAdvanceBookingDays) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Bookings cannot be made more than ${config.maxAdvanceBookingDays} days in advance`,
      });
    }

    // 4. Validate truck
    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Truck not found",
      });
    }
    if (!truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Truck is not active",
      });
    }
    if (truck.carrierCompanyId !== user.carrierCompanyId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only book with trucks from your company",
      });
    }

    // 5. Get gate and terminal
    const gate = await ctx.db.get(timeSlot.gateId);
    if (!gate || !gate.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Gate is not available",
      });
    }

    const terminal = await ctx.db.get(gate.terminalId);
    if (!terminal || !terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Terminal is not available",
      });
    }

    // 6. Validate truck compatibility with gate
    const compatibility = await validateTruckForGate(ctx, args.truckId, timeSlot.gateId);
    if (!compatibility.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: compatibility.reason ?? "Truck is not compatible with this gate",
      });
    }

    // 7. Check if truck already has a booking for this time slot
    const existingTruckBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.truckId))
      .filter((q) =>
        q.and(
          q.eq(q.field("timeSlotId"), args.timeSlotId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .first();

    if (existingTruckBooking) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "This truck already has a booking for this time slot",
      });
    }

    // 8. Reserve capacity (atomic)
    const reserved = await checkAndReserveCapacity(ctx, args.timeSlotId);
    if (!reserved) {
      throw new ConvexError({
        code: "CAPACITY_FULL",
        message: "This time slot is fully booked",
      });
    }

    // 9. Generate booking reference
    const bookingReference = await generateBookingReference(ctx);

    // 10. Create the booking
    const nowTs = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      timeSlotId: args.timeSlotId,
      truckId: args.truckId,
      carrierCompanyId: user.carrierCompanyId,
      gateId: timeSlot.gateId,
      terminalId: gate.terminalId,
      bookingReference,
      status: "pending",
      qrCode: generateQRCodePlaceholder(bookingReference),
      driverName: args.driverName?.trim(),
      driverPhone: args.driverPhone?.trim(),
      driverIdNumber: args.driverIdNumber?.trim(),
      containerNumber: args.containerNumber?.trim(),
      cargoDescription: args.cargoDescription?.trim(),
      bookedAt: nowTs,
      createdBy: user.userId,
      updatedAt: nowTs,
    });

    // 11. Record history
    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId,
      changeType: "created",
      newValue: JSON.stringify({
        timeSlotId: args.timeSlotId,
        truckId: args.truckId,
        status: "pending",
      }),
      changedBy: user.userId,
      requiredRebook: false,
    });

    return bookingId;
  },
});

// ============================================================================
// STATUS CHANGES
// ============================================================================

/**
 * Confirm a pending booking (terminal operator/admin)
 */
export const confirm = mutation({
  args: {
    bookingId: v.id("bookings"),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    // Check permission for this terminal
    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "confirmed");
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to confirm this booking",
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(booking.status, "confirmed")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot confirm a booking with status "${booking.status}"`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      confirmedAt: now,
      processedBy: user.userId,
      updatedAt: now,
    });

    // Record history
    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "status_changed",
      previousValue: booking.status,
      newValue: "confirmed",
      changedBy: user.userId,
      note: args.note,
      requiredRebook: false,
    });

    return null;
  },
});

/**
 * Reject a pending booking (terminal operator/admin)
 */
export const reject = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "rejected");
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to reject this booking",
      });
    }

    if (!isValidStatusTransition(booking.status, "rejected")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot reject a booking with status "${booking.status}"`,
      });
    }

    // Release capacity
    await releaseCapacity(ctx, booking.timeSlotId);

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "rejected",
      rejectedAt: now,
      statusReason: args.reason.trim(),
      processedBy: user.userId,
      updatedAt: now,
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "status_changed",
      previousValue: booking.status,
      newValue: "rejected",
      changedBy: user.userId,
      note: args.reason,
      requiredRebook: false,
    });

    return null;
  },
});

/**
 * Cancel a booking (carrier can cancel their own, operators can cancel any)
 */
export const cancel = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    // Check permission
    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "cancelled");
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to cancel this booking",
      });
    }

    // For carriers, check cancellation policy
    if (isCarrier(user)) {
      const cancelCheck = await canCancelBooking(ctx, args.bookingId);
      if (!cancelCheck.canCancel) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: cancelCheck.reason ?? "Cannot cancel this booking",
        });
      }
    }

    if (!isValidStatusTransition(booking.status, "cancelled")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot cancel a booking with status "${booking.status}"`,
      });
    }

    // Release capacity
    await releaseCapacity(ctx, booking.timeSlotId);

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancelledAt: now,
      statusReason: args.reason?.trim(),
      processedBy: user.userId,
      updatedAt: now,
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "status_changed",
      previousValue: booking.status,
      newValue: "cancelled",
      changedBy: user.userId,
      note: args.reason,
      requiredRebook: false,
    });

    return null;
  },
});

/**
 * Mark a booking as consumed (truck arrived and entered)
 */
export const markConsumed = mutation({
  args: {
    bookingId: v.id("bookings"),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    const canModify = await canModifyBookingStatus(ctx, user, args.bookingId, "consumed");
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to mark this booking as consumed",
      });
    }

    if (!isValidStatusTransition(booking.status, "consumed")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot mark as consumed a booking with status "${booking.status}"`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "consumed",
      consumedAt: now,
      processedBy: user.userId,
      updatedAt: now,
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "status_changed",
      previousValue: booking.status,
      newValue: "consumed",
      changedBy: user.userId,
      note: args.note,
      requiredRebook: false,
    });

    return null;
  },
});

// ============================================================================
// MODIFICATIONS (Non-capacity affecting)
// ============================================================================

/**
 * Update driver information (non-capacity affecting)
 */
export const updateDriver = mutation({
  args: {
    bookingId: v.id("bookings"),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverIdNumber: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    // Carrier can update their own bookings
    const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
    if (!canView && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this booking",
      });
    }

    // Can only update pending or confirmed bookings
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot update a booking with status "${booking.status}"`,
      });
    }

    const previousValues = {
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverIdNumber: booking.driverIdNumber,
    };

    await ctx.db.patch(args.bookingId, {
      driverName: args.driverName?.trim() ?? booking.driverName,
      driverPhone: args.driverPhone?.trim() ?? booking.driverPhone,
      driverIdNumber: args.driverIdNumber?.trim() ?? booking.driverIdNumber,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "driver_updated",
      previousValue: JSON.stringify(previousValues),
      newValue: JSON.stringify({
        driverName: args.driverName?.trim() ?? booking.driverName,
        driverPhone: args.driverPhone?.trim() ?? booking.driverPhone,
        driverIdNumber: args.driverIdNumber?.trim() ?? booking.driverIdNumber,
      }),
      changedBy: user.userId,
      requiredRebook: false,
    });

    return null;
  },
});

/**
 * Update cargo details (non-capacity affecting)
 */
export const updateDetails = mutation({
  args: {
    bookingId: v.id("bookings"),
    containerNumber: v.optional(v.string()),
    cargoDescription: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
    if (!canView && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this booking",
      });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot update a booking with status "${booking.status}"`,
      });
    }

    const previousValues = {
      containerNumber: booking.containerNumber,
      cargoDescription: booking.cargoDescription,
    };

    await ctx.db.patch(args.bookingId, {
      containerNumber: args.containerNumber?.trim() ?? booking.containerNumber,
      cargoDescription: args.cargoDescription?.trim() ?? booking.cargoDescription,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "details_updated",
      previousValue: JSON.stringify(previousValues),
      newValue: JSON.stringify({
        containerNumber: args.containerNumber?.trim() ?? booking.containerNumber,
        cargoDescription: args.cargoDescription?.trim() ?? booking.cargoDescription,
      }),
      changedBy: user.userId,
      requiredRebook: false,
    });

    return null;
  },
});

/**
 * Change truck (non-capacity affecting, but requires validation)
 * Status stays the same
 */
export const changeTruck = mutation({
  args: {
    bookingId: v.id("bookings"),
    newTruckId: v.id("trucks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
    if (!canView && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this booking",
      });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot change truck for a booking with status "${booking.status}"`,
      });
    }

    // Validate new truck
    const newTruck = await ctx.db.get(args.newTruckId);
    if (!newTruck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "New truck not found",
      });
    }
    if (!newTruck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "New truck is not active",
      });
    }
    if (newTruck.carrierCompanyId !== booking.carrierCompanyId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "New truck must belong to the same carrier company",
      });
    }

    // Validate compatibility with gate
    const compatibility = await validateTruckForGate(ctx, args.newTruckId, booking.gateId);
    if (!compatibility.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: compatibility.reason ?? "New truck is not compatible with the gate",
      });
    }

    // Check new truck doesn't have a booking for this slot
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.newTruckId))
      .filter((q) =>
        q.and(
          q.eq(q.field("timeSlotId"), booking.timeSlotId),
          q.neq(q.field("_id"), args.bookingId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .first();

    if (existingBooking) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "The new truck already has a booking for this time slot",
      });
    }

    const previousTruckId = booking.truckId;

    await ctx.db.patch(args.bookingId, {
      truckId: args.newTruckId,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "truck_changed",
      previousValue: previousTruckId,
      newValue: args.newTruckId,
      changedBy: user.userId,
      requiredRebook: false,
    });

    return null;
  },
});

// ============================================================================
// CAPACITY-AFFECTING CHANGES (Rebook)
// ============================================================================

/**
 * Change time slot (capacity-affecting - resets to pending)
 */
export const changeTimeSlot = mutation({
  args: {
    bookingId: v.id("bookings"),
    newTimeSlotId: v.id("timeSlots"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    const canView = await canViewCarrier(ctx, user, booking.carrierCompanyId);
    if (!canView && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this booking",
      });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot change time slot for a booking with status "${booking.status}"`,
      });
    }

    // Validate new time slot
    const newTimeSlot = await ctx.db.get(args.newTimeSlotId);
    if (!newTimeSlot) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "New time slot not found",
      });
    }
    if (!newTimeSlot.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "New time slot is not available",
      });
    }

    // Validate time slot is in the future
    const slotDateTime = new Date(`${newTimeSlot.date}T${newTimeSlot.startTime}`);
    if (slotDateTime <= new Date()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Cannot book a time slot in the past",
      });
    }

    // Validate truck compatibility with new gate
    const compatibility = await validateTruckForGate(ctx, booking.truckId, newTimeSlot.gateId);
    if (!compatibility.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: compatibility.reason ?? "Truck is not compatible with the new gate",
      });
    }

    // Check truck doesn't have another booking for new slot
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", booking.truckId))
      .filter((q) =>
        q.and(
          q.eq(q.field("timeSlotId"), args.newTimeSlotId),
          q.neq(q.field("_id"), args.bookingId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .first();

    if (existingBooking) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "This truck already has a booking for the new time slot",
      });
    }

    // Reserve capacity on new slot first
    const reserved = await checkAndReserveCapacity(ctx, args.newTimeSlotId);
    if (!reserved) {
      throw new ConvexError({
        code: "CAPACITY_FULL",
        message: "The new time slot is fully booked",
      });
    }

    // Release capacity from old slot
    await releaseCapacity(ctx, booking.timeSlotId);

    // Get new gate/terminal info
    const newGate = await ctx.db.get(newTimeSlot.gateId);

    const previousTimeSlotId = booking.timeSlotId;
    const wasConfirmed = booking.status === "confirmed";

    await ctx.db.patch(args.bookingId, {
      timeSlotId: args.newTimeSlotId,
      gateId: newTimeSlot.gateId,
      terminalId: newGate?.terminalId ?? booking.terminalId,
      status: "pending", // Reset to pending for re-confirmation
      confirmedAt: undefined, // Clear confirmation
      processedBy: undefined,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: args.bookingId,
      changeType: "time_slot_changed",
      previousValue: previousTimeSlotId,
      newValue: args.newTimeSlotId,
      changedBy: user.userId,
      note: wasConfirmed ? "Booking reset to pending for re-confirmation" : undefined,
      requiredRebook: wasConfirmed,
    });

    return null;
  },
});
