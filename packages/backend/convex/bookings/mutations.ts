/**
 * Booking Mutations
 * Create, update, and manage booking lifecycle
 * 
 * Updated for new schema:
 * - Terminal-level booking (not gate-level)
 * - Multiple containers per booking (containerIds array)
 * - Auto-validation flow
 * - Gate assigned at confirmation time
 * - Carriers can cancel anytime (no cancellation window)
 * - Only truck can be changed; other changes require cancel + rebook
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  isPortAdmin,
  isCarrier,
  canManageTerminal,
  canModifyBookingStatus,
  isBookingOwner,
} from "../lib/permissions";
import {
  bookingInputValidator,
  isValidStatusTransition,
} from "../lib/validators";
import {
  checkAndReserveCapacity,
  releaseCapacityBySlotInfo,
} from "../lib/capacity";
import { shouldAutoValidateBooking } from "../lib/autoValidation";
import {
  generateBookingReference,
  generateQRCodePlaceholder,
  validateTruckForTerminal,
  getSystemConfig,
  canCancelBooking,
  validateContainersForBooking,
  associateContainersWithBooking,
  disassociateContainersFromBooking,
  assignGateForBooking,
} from "./internal";
import { internal } from "../_generated/api";

// ============================================================================
// CREATE BOOKING
// ============================================================================

/**
 * Create a new booking
 * Carriers create bookings for their own trucks and containers
 * Terminal-level, gate assigned at confirmation
 */
export const create = mutation({
  args: bookingInputValidator.fields,
  returns: v.id("bookings"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    // 1. Validate terminal exists and is active
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal introuvable",
      });
    }
    if (!terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Terminal non disponible",
      });
    }

    // 2. Validate time slot is in the future
    const slotDateTime = new Date(
      `${args.preferredDate}T${args.preferredTimeStart}`
    );
    const now = new Date();
    if (slotDateTime <= now) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Impossible de réserver un créneau dans le passé",
      });
    }

    // 3. Check system config for advance booking rules
    const config = await getSystemConfig(ctx);
    const hoursUntilSlot =
      (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSlot < config.minAdvanceBookingHours) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Les réservations doivent être faites au moins ${config.minAdvanceBookingHours} heures à l'avance`,
      });
    }

    const daysUntilSlot = hoursUntilSlot / 24;
    if (daysUntilSlot > config.maxAdvanceBookingDays) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Les réservations ne peuvent pas être faites plus de ${config.maxAdvanceBookingDays} jours à l'avance`,
      });
    }

    // 4. Validate truck ownership and availability
    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Camion introuvable",
      });
    }
    if (!truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Camion non actif",
      });
    }
    if (truck.ownerId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez réserver qu'avec vos propres camions",
      });
    }

    // 5. Validate truck compatibility with terminal gates
    const truckCompatibility = await validateTruckForTerminal(
      ctx,
      args.truckId,
      args.terminalId
    );
    if (!truckCompatibility.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message:
          truckCompatibility.reason ??
          "Camion non compatible avec ce terminal",
      });
    }

    // 6. Validate containers
    const containerValidation = await validateContainersForBooking(
      ctx,
      args.containerIds,
      user.userId,
      config.maxContainersPerBooking
    );
    if (!containerValidation.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: containerValidation.reason ?? "Conteneurs non valides",
      });
    }

    // 7. Check if truck already has a booking for this time slot
    const existingTruckBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.truckId))
      .filter((q) =>
        q.and(
          q.eq(q.field("preferredDate"), args.preferredDate),
          q.eq(q.field("preferredTimeStart"), args.preferredTimeStart),
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
        message: "Ce camion a déjà une réservation pour ce créneau",
      });
    }

    // 8. Reserve capacity (atomic) - terminal level
    const reserved = await checkAndReserveCapacity(
      ctx,
      args.terminalId,
      args.preferredDate,
      args.preferredTimeStart,
      args.preferredTimeEnd
    );
    if (!reserved.success) {
      throw new ConvexError({
        code: "CAPACITY_FULL",
        message: reserved.error ?? "Ce créneau est complet",
      });
    }

    // 9. Check auto-validation eligibility
    const autoValidation = await shouldAutoValidateBooking(
      ctx,
      args.terminalId,
      args.preferredDate,
      args.preferredTimeStart
    );

    // 10. Generate booking reference
    const bookingReference = await generateBookingReference(
      ctx,
      args.terminalId
    );

    // 11. Determine initial status
    const initialStatus = autoValidation.shouldAutoValidate
      ? "confirmed"
      : "pending";

    // 12. Create the booking
    const nowTs = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      terminalId: args.terminalId,
      carrierId: user.userId,
      truckId: args.truckId,
      containerIds: args.containerIds,
      bookingReference,
      status: initialStatus,
      wasAutoValidated: autoValidation.shouldAutoValidate,
      preferredDate: args.preferredDate,
      preferredTimeStart: args.preferredTimeStart,
      preferredTimeEnd: args.preferredTimeEnd,
      qrCode: generateQRCodePlaceholder(bookingReference),
      driverName: args.driverName?.trim(),
      driverPhone: args.driverPhone?.trim(),
      driverIdNumber: args.driverIdNumber?.trim(),
      bookedAt: nowTs,
      confirmedAt: autoValidation.shouldAutoValidate ? nowTs : undefined,
      createdBy: user.userId,
      updatedAt: nowTs,
    });

    // 13. Associate containers with booking
    await associateContainersWithBooking(ctx, args.containerIds, bookingId);

    // 14. If auto-validated, assign gate
    if (autoValidation.shouldAutoValidate) {
      const gateId = await assignGateForBooking(ctx, bookingId);
      if (gateId) {
        await ctx.db.patch(bookingId, { gateId });
      }
    }

    // 15. Record history
    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId,
      changeType: "created",
      newValue: JSON.stringify({
        terminalId: args.terminalId,
        truckId: args.truckId,
        containerIds: args.containerIds,
        status: initialStatus,
        wasAutoValidated: autoValidation.shouldAutoValidate,
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
 * Gate is assigned at confirmation
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
        message: "Réservation introuvable",
      });
    }

    // Check permission for this terminal
    const canModify = await canModifyBookingStatus(
      ctx,
      user,
      args.bookingId,
      "confirmed"
    );
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission de confirmer cette réservation",
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(booking.status, "confirmed")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de confirmer une réservation avec le statut "${booking.status}"`,
      });
    }

    // Assign gate using load-balanced selection
    const gateId = await assignGateForBooking(ctx, args.bookingId);

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      confirmedAt: now,
      gateId: gateId ?? undefined,
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
        message: "Réservation introuvable",
      });
    }

    const canModify = await canModifyBookingStatus(
      ctx,
      user,
      args.bookingId,
      "rejected"
    );
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission de rejeter cette réservation",
      });
    }

    if (!isValidStatusTransition(booking.status, "rejected")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de rejeter une réservation avec le statut "${booking.status}"`,
      });
    }

    // Release capacity
    await releaseCapacityBySlotInfo(
      ctx,
      booking.terminalId,
      booking.preferredDate,
      booking.preferredTimeStart
    );

    // Disassociate containers
    await disassociateContainersFromBooking(ctx, args.bookingId);

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
 * Note: Carriers can cancel anytime (no cancellation window)
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
        message: "Réservation introuvable",
      });
    }

    // Check permission
    const canModify = await canModifyBookingStatus(
      ctx,
      user,
      args.bookingId,
      "cancelled"
    );
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission d'annuler cette réservation",
      });
    }

    // For carriers, check cancellation policy (always allowed in new schema)
    if (isCarrier(user)) {
      const cancelCheck = await canCancelBooking(ctx, args.bookingId);
      if (!cancelCheck.canCancel) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: cancelCheck.reason ?? "Impossible d'annuler cette réservation",
        });
      }
    }

    if (!isValidStatusTransition(booking.status, "cancelled")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible d'annuler une réservation avec le statut "${booking.status}"`,
      });
    }

    // Release capacity
    await releaseCapacityBySlotInfo(
      ctx,
      booking.terminalId,
      booking.preferredDate,
      booking.preferredTimeStart
    );

    // Disassociate containers
    await disassociateContainersFromBooking(ctx, args.bookingId);

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
 * Records entry scan timestamp
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
        message: "Réservation introuvable",
      });
    }

    const canModify = await canModifyBookingStatus(
      ctx,
      user,
      args.bookingId,
      "consumed"
    );
    if (!canModify) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Vous n'avez pas la permission de marquer cette réservation comme consommée",
      });
    }

    if (!isValidStatusTransition(booking.status, "consumed")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de marquer comme consommée une réservation avec le statut "${booking.status}"`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "consumed",
      consumedAt: now,
      entryScannedAt: now,
      scannedByEntry: user.userId,
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

/**
 * Record exit scan for a consumed booking
 */
export const recordExitScan = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }

    if (booking.status !== "consumed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Le scan de sortie n'est possible que pour les réservations consommées",
      });
    }

    // Check terminal access
    const canManage = await canManageTerminal(ctx, user, booking.terminalId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès à ce terminal",
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      exitScannedAt: now,
      scannedByExit: user.userId,
      updatedAt: now,
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
        message: "Réservation introuvable",
      });
    }

    // Carrier can update their own bookings, admin can update any
    const isOwner = await isBookingOwner(ctx, user, args.bookingId);
    if (!isOwner && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission de modifier cette réservation",
      });
    }

    // Can only update pending or confirmed bookings
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de modifier une réservation avec le statut "${booking.status}"`,
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
 * Change truck (non-capacity affecting, but requires validation)
 * Status stays the same - this is the ONLY modifiable field besides driver info
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
        message: "Réservation introuvable",
      });
    }

    const isOwner = await isBookingOwner(ctx, user, args.bookingId);
    if (!isOwner && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission de modifier cette réservation",
      });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Impossible de changer le camion pour une réservation avec le statut "${booking.status}"`,
      });
    }

    // Validate new truck ownership
    const newTruck = await ctx.db.get(args.newTruckId);
    if (!newTruck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Nouveau camion introuvable",
      });
    }
    if (!newTruck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Nouveau camion non actif",
      });
    }
    // Truck must belong to the same carrier
    if (newTruck.ownerId !== booking.carrierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Le nouveau camion doit appartenir au même transporteur",
      });
    }

    // Validate compatibility with terminal
    const compatibility = await validateTruckForTerminal(
      ctx,
      args.newTruckId,
      booking.terminalId
    );
    if (!compatibility.valid) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message:
          compatibility.reason ??
          "Nouveau camion non compatible avec le terminal",
      });
    }

    // If booking is confirmed with gate assigned, validate gate compatibility
    if (booking.gateId) {
      const { validateTruckForGate } = await import("./internal");
      const gateCompatibility = await validateTruckForGate(
        ctx,
        args.newTruckId,
        booking.gateId
      );
      if (!gateCompatibility.valid) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message:
            gateCompatibility.reason ??
            "Nouveau camion non compatible avec le portail assigné",
        });
      }
    }

    // Check new truck doesn't have a booking for this slot
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.newTruckId))
      .filter((q) =>
        q.and(
          q.eq(q.field("preferredDate"), booking.preferredDate),
          q.eq(q.field("preferredTimeStart"), booking.preferredTimeStart),
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
        message: "Le nouveau camion a déjà une réservation pour ce créneau",
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
// QR CODE SCANNING
// ============================================================================

/**
 * Scan QR code for entry (lookup by booking reference)
 */
export const scanEntry = mutation({
  args: {
    bookingReference: v.string(),
  },
  returns: v.object({
    bookingId: v.id("bookings"),
    status: v.string(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) =>
        q.eq("bookingReference", args.bookingReference)
      )
      .unique();

    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }

    // Check terminal access
    const canManage = await canManageTerminal(ctx, user, booking.terminalId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès à ce terminal",
      });
    }

    // Validate booking can be consumed
    if (booking.status !== "confirmed") {
      return {
        bookingId: booking._id,
        status: booking.status,
        message: `Réservation ne peut pas être scannée (statut: ${booking.status})`,
      };
    }

    // Check date matches
    const today = new Date().toISOString().slice(0, 10);
    if (booking.preferredDate !== today) {
      return {
        bookingId: booking._id,
        status: booking.status,
        message: `Réservation prévue pour ${booking.preferredDate}, pas aujourd'hui`,
      };
    }

    // Mark as consumed
    const now = Date.now();
    await ctx.db.patch(booking._id, {
      status: "consumed",
      consumedAt: now,
      entryScannedAt: now,
      scannedByEntry: user.userId,
      processedBy: user.userId,
      updatedAt: now,
    });

    await ctx.runMutation(internal.bookings.internal.recordHistory, {
      bookingId: booking._id,
      changeType: "status_changed",
      previousValue: "confirmed",
      newValue: "consumed",
      changedBy: user.userId,
      note: "Entrée scannée via QR code",
      requiredRebook: false,
    });

    return {
      bookingId: booking._id,
      status: "consumed",
      message: "Entrée enregistrée avec succès",
    };
  },
});
