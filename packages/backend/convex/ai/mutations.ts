/**
 * Internal Mutations for AI Tools
 *
 * These are internal mutations called by the agent tools.
 * They bypass the normal auth middleware because the agent action
 * already authenticated the user and passes userId explicitly.
 *
 * IMPORTANT: All mutations respect RBAC - the userId is used to
 * verify ownership and permissions.
 */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id, DataModel } from "../_generated/dataModel";
import { authComponent } from "../auth";
import type { GenericCtx } from "@convex-dev/better-auth";

// ============================================================================
// HELPERS
// ============================================================================

async function getUserRoleHelper(ctx: { db: any }, userId: string): Promise<string | null> {
  // Use authComponent to query Better Auth user table properly
  const authUser = await authComponent.getAnyUserById(
    ctx as unknown as GenericCtx<DataModel>,
    userId
  );
  if (!authUser) return null;
  return (authUser as unknown as { role: string }).role ?? null;
}

// ============================================================================
// BOOKING MUTATIONS
// ============================================================================

/**
 * Create a booking from AI assistant
 * Validates all inputs and creates booking with auto-validation check
 */
export const createBookingFromAI = internalMutation({
  args: {
    userId: v.string(),
    terminalCode: v.string(),
    licensePlate: v.string(),
    containerNumbers: v.array(v.string()),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check user role
    const role = await getUserRoleHelper(ctx, args.userId);
    if (role !== "carrier") {
      return {
        success: false,
        error: "Seuls les transporteurs peuvent créer des réservations",
      };
    }

    // Find terminal
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();

    if (!terminal) {
      return { success: false, error: "Terminal introuvable" };
    }

    if (!terminal.isActive) {
      return { success: false, error: "Terminal non disponible" };
    }

    // Find truck
    const truck = await ctx.db
      .query("trucks")
      .withIndex("by_license_plate", (q: any) =>
        q.eq("licensePlate", args.licensePlate.toUpperCase().trim())
      )
      .unique();

    if (!truck) {
      return { success: false, error: "Camion introuvable" };
    }

    if (truck.ownerId !== args.userId) {
      return {
        success: false,
        error: "Vous ne pouvez réserver qu'avec vos propres camions",
      };
    }

    if (!truck.isActive) {
      return { success: false, error: "Camion non actif" };
    }

    // Find containers
    const containerIds: Id<"containers">[] = [];
    for (const num of args.containerNumbers) {
      const container = await ctx.db
        .query("containers")
        .withIndex("by_container_number", (q: any) =>
          q.eq("containerNumber", num.toUpperCase().trim())
        )
        .unique();

      if (!container) {
        return {
          success: false,
          error: `Conteneur ${num} introuvable`,
        };
      }

      if (container.ownerId !== args.userId) {
        return {
          success: false,
          error: `Conteneur ${num} ne vous appartient pas`,
        };
      }

      if (container.bookingId) {
        return {
          success: false,
          error: `Conteneur ${num} déjà assigné à une réservation`,
        };
      }

      containerIds.push(container._id);
    }

    if (containerIds.length === 0) {
      return { success: false, error: "Au moins un conteneur est requis" };
    }

    // Validate date is in the future
    const slotDateTime = new Date(`${args.date}T${args.startTime}`);
    const now = new Date();
    if (slotDateTime <= now) {
      return {
        success: false,
        error: "Impossible de réserver un créneau dans le passé",
      };
    }

    // Check existing booking for truck
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q: any) => q.eq("truckId", truck._id))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("preferredDate"), args.date),
          q.eq(q.field("preferredTimeStart"), args.startTime),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .first();

    if (existingBooking) {
      return {
        success: false,
        error: "Ce camion a déjà une réservation pour ce créneau",
      };
    }

    // Check/reserve capacity
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getDay();
    const hour = parseInt(args.startTime.split(":")[0], 10);

    // Get template for this slot
    const template = await ctx.db
      .query("slotTemplates")
      .withIndex("by_terminal_day_hour", (q: any) =>
        q.eq("terminalId", terminal._id).eq("dayOfWeek", dayOfWeek).eq("hour", hour)
      )
      .first();

    if (!template || !template.isActive) {
      return {
        success: false,
        error: "Ce créneau horaire n'est pas disponible",
      };
    }

    // Get or create time slot
    let slot = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q: any) =>
        q.eq("terminalId", terminal._id).eq("date", args.date)
      )
      .filter((q: any) => q.eq(q.field("startTime"), args.startTime))
      .first();

    const nowTs = Date.now();

    if (!slot) {
      // Create slot
      const slotId = await ctx.db.insert("timeSlots", {
        terminalId: terminal._id,
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        maxCapacity: template.maxCapacity,
        autoValidationThreshold: terminal.autoValidationThreshold,
        currentBookings: 0,
        isActive: true,
        createdAt: nowTs,
        updatedAt: nowTs,
        createdBy: "system",
      });
      slot = await ctx.db.get(slotId);
    }

    if (!slot) {
      return { success: false, error: "Erreur lors de la création du créneau" };
    }

    // Check capacity
    if (slot.currentBookings >= slot.maxCapacity) {
      return { success: false, error: "Ce créneau est complet" };
    }

    // Determine if auto-validation applies
    const maxAutoValidated = Math.floor(
      (slot.maxCapacity * (slot.autoValidationThreshold ?? terminal.autoValidationThreshold)) / 100
    );
    const shouldAutoValidate = slot.currentBookings < maxAutoValidated;

    // Generate booking reference
    const count = await ctx.db
      .query("bookings")
      .withIndex("by_terminal", (q: any) => q.eq("terminalId", terminal._id))
      .collect();
    const seq = (count.length + 1).toString().padStart(6, "0");
    const bookingReference = `${terminal.code}-BK-${seq}`;

    // Create booking
    const bookingId = await ctx.db.insert("bookings", {
      terminalId: terminal._id,
      carrierId: args.userId,
      truckId: truck._id,
      containerIds,
      bookingReference,
      status: shouldAutoValidate ? "confirmed" : "pending",
      wasAutoValidated: shouldAutoValidate,
      preferredDate: args.date,
      preferredTimeStart: args.startTime,
      preferredTimeEnd: args.endTime,
      driverName: args.driverName?.trim(),
      driverPhone: args.driverPhone?.trim(),
      bookedAt: nowTs,
      confirmedAt: shouldAutoValidate ? nowTs : undefined,
      createdBy: args.userId,
      updatedAt: nowTs,
    });

    // Update slot capacity
    await ctx.db.patch(slot._id, {
      currentBookings: slot.currentBookings + 1,
      updatedAt: nowTs,
    });

    // Associate containers with booking
    for (const containerId of containerIds) {
      await ctx.db.patch(containerId, {
        bookingId,
        updatedAt: nowTs,
      });
    }

    return {
      success: true,
      bookingReference,
      status: shouldAutoValidate ? "confirmed" : "pending",
      wasAutoValidated: shouldAutoValidate,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      terminalName: terminal.name,
      containerCount: containerIds.length,
    };
  },
});

/**
 * Cancel a booking from AI assistant
 */
export const cancelBookingFromAI = internalMutation({
  args: {
    userId: v.string(),
    bookingReference: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find booking
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q: any) =>
        q.eq("bookingReference", args.bookingReference)
      )
      .unique();

    if (!booking) {
      return { success: false, error: "Réservation introuvable" };
    }

    // Check ownership
    if (booking.carrierId !== args.userId) {
      const role = await getUserRoleHelper(ctx, args.userId);
      if (role !== "port_admin" && role !== "terminal_operator") {
        return {
          success: false,
          error: "Vous ne pouvez annuler que vos propres réservations",
        };
      }
    }

    // Check status
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return {
        success: false,
        error: `Impossible d'annuler une réservation avec le statut "${booking.status}"`,
      };
    }

    const nowTs = Date.now();

    // Release capacity
    const slot = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q: any) =>
        q.eq("terminalId", booking.terminalId).eq("date", booking.preferredDate)
      )
      .filter((q: any) => q.eq(q.field("startTime"), booking.preferredTimeStart))
      .first();

    if (slot && slot.currentBookings > 0) {
      await ctx.db.patch(slot._id, {
        currentBookings: slot.currentBookings - 1,
        updatedAt: nowTs,
      });
    }

    // Disassociate containers
    for (const containerId of booking.containerIds) {
      const container = await ctx.db.get(containerId);
      if (container && container.bookingId === booking._id) {
        await ctx.db.patch(containerId, {
          bookingId: undefined,
          updatedAt: nowTs,
        });
      }
    }

    // Update booking status
    await ctx.db.patch(booking._id, {
      status: "cancelled",
      cancelledAt: nowTs,
      statusReason: args.reason?.trim(),
      processedBy: args.userId,
      updatedAt: nowTs,
    });

    return {
      success: true,
      bookingReference: booking.bookingReference,
      previousStatus: booking.status,
      newStatus: "cancelled",
    };
  },
});
