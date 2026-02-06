/**
 * Internal Booking Functions
 * Utility functions for booking reference generation, QR codes, and gate assignment
 * 
 * Updated for new schema:
 * - Terminal-prefixed booking references
 * - Gate assignment at confirmation time
 * - Carriers can cancel anytime (no cancellation window)
 */
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

// ============================================================================
// BOOKING REFERENCE GENERATION
// ============================================================================

/**
 * Generate a unique booking reference with terminal prefix
 * Format: TERMINAL_CODE-BK-YYYYMMDD-XXXX (e.g., TER1-BK-20240115-0001)
 */
export async function generateBookingReference(
  ctx: MutationCtx | QueryCtx,
  terminalId: Id<"terminals">
): Promise<string> {
  const terminal = await ctx.db.get(terminalId);
  if (!terminal) {
    throw new Error("Terminal not found for booking reference generation");
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `${terminal.code}-BK-${dateStr}-`;

  // Find the highest reference number for today at this terminal
  const todayBookings = await ctx.db
    .query("bookings")
    .withIndex("by_reference")
    .filter((q) =>
      q.and(
        q.gte(q.field("bookingReference"), prefix),
        q.lt(q.field("bookingReference"), `${terminal.code}-BK-${dateStr}0`)
      )
    )
    .collect();

  // Find the max sequence number
  let maxSeq = 0;
  const seqPattern = new RegExp(`${terminal.code}-BK-\\d{8}-(\\d{4})`);
  for (const booking of todayBookings) {
    const match = booking.bookingReference.match(seqPattern);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  // Generate new reference
  const newSeq = (maxSeq + 1).toString().padStart(4, "0");
  return `${prefix}${newSeq}`;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

/**
 * Generate a simple QR code data URL placeholder
 * In production, use an action with a proper QR library
 */
export function generateQRCodePlaceholder(bookingReference: string): string {
  // For now, return a placeholder
  // In production, use an action with 'qrcode' library
  return `qr:${bookingReference}`;
}

// ============================================================================
// GATE ASSIGNMENT (Load-Balanced)
// ============================================================================

/**
 * Assign a gate to a booking using load-balanced selection
 * Called at confirmation time, not at booking creation
 * 
 * Selection algorithm:
 * 1. Filter gates by truck compatibility (type and class)
 * 2. Among compatible gates, select the one with least bookings for the slot
 */
export async function assignGateForBooking(
  ctx: MutationCtx,
  bookingId: Id<"bookings">
): Promise<Id<"gates"> | null> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return null;

  const truck = await ctx.db.get(booking.truckId);
  if (!truck) return null;

  // Get all active gates for this terminal
  const gates = await ctx.db
    .query("gates")
    .withIndex("by_terminal_and_active", (q) =>
      q.eq("terminalId", booking.terminalId).eq("isActive", true)
    )
    .collect();

  if (gates.length === 0) return null;

  // Filter gates by truck compatibility
  const compatibleGates = gates.filter((gate) => {
    const typeOk = gate.allowedTruckTypes.includes(truck.truckType);
    const classOk = gate.allowedTruckClasses.includes(truck.truckClass);
    return typeOk && classOk;
  });

  if (compatibleGates.length === 0) return null;

  // For each compatible gate, count current bookings for this slot
  const gateLoads: { gateId: Id<"gates">; count: number }[] = [];

  for (const gate of compatibleGates) {
    const bookingsAtGate = await ctx.db
      .query("bookings")
      .withIndex("by_gate", (q) => q.eq("gateId", gate._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("preferredDate"), booking.preferredDate),
          q.eq(q.field("preferredTimeStart"), booking.preferredTimeStart),
          q.or(
            q.eq(q.field("status"), "confirmed"),
            q.eq(q.field("status"), "consumed")
          )
        )
      )
      .collect();

    gateLoads.push({
      gateId: gate._id,
      count: bookingsAtGate.length,
    });
  }

  // Sort by load (ascending) and select the least loaded gate
  gateLoads.sort((a, b) => a.count - b.count);
  
  return gateLoads[0]?.gateId ?? null;
}

/**
 * Validate that a truck can be used at a specific gate
 * Checks truck type and class compatibility
 */
export async function validateTruckForGate(
  ctx: QueryCtx,
  truckId: Id<"trucks">,
  gateId: Id<"gates">
): Promise<{ valid: boolean; reason?: string }> {
  const truck = await ctx.db.get(truckId);
  if (!truck) {
    return { valid: false, reason: "Camion introuvable" };
  }

  const gate = await ctx.db.get(gateId);
  if (!gate) {
    return { valid: false, reason: "Portail introuvable" };
  }

  // Check truck type
  if (!gate.allowedTruckTypes.includes(truck.truckType)) {
    return {
      valid: false,
      reason: `Type de camion "${truck.truckType}" non autorisé à ce portail. Types autorisés: ${gate.allowedTruckTypes.join(", ")}`,
    };
  }

  // Check truck class
  if (!gate.allowedTruckClasses.includes(truck.truckClass)) {
    return {
      valid: false,
      reason: `Classe de camion "${truck.truckClass}" non autorisée à ce portail. Classes autorisées: ${gate.allowedTruckClasses.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Check if truck is compatible with any gate at a terminal
 */
export async function validateTruckForTerminal(
  ctx: QueryCtx,
  truckId: Id<"trucks">,
  terminalId: Id<"terminals">
): Promise<{ valid: boolean; reason?: string; compatibleGates: Doc<"gates">[] }> {
  const truck = await ctx.db.get(truckId);
  if (!truck) {
    return { valid: false, reason: "Camion introuvable", compatibleGates: [] };
  }

  const gates = await ctx.db
    .query("gates")
    .withIndex("by_terminal_and_active", (q) =>
      q.eq("terminalId", terminalId).eq("isActive", true)
    )
    .collect();

  if (gates.length === 0) {
    return { valid: false, reason: "Aucun portail actif pour ce terminal", compatibleGates: [] };
  }

  const compatibleGates = gates.filter((gate) => {
    const typeOk = gate.allowedTruckTypes.includes(truck.truckType);
    const classOk = gate.allowedTruckClasses.includes(truck.truckClass);
    return typeOk && classOk;
  });

  if (compatibleGates.length === 0) {
    return {
      valid: false,
      reason: `Aucun portail compatible avec le camion (type: ${truck.truckType}, classe: ${truck.truckClass})`,
      compatibleGates: [],
    };
  }

  return { valid: true, compatibleGates };
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/**
 * Get system configuration for booking rules
 */
export async function getSystemConfig(ctx: QueryCtx) {
  const config = await ctx.db.query("systemConfig").first();

  // Return defaults if no config exists
  return (
    config ?? {
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      noShowGracePeriodMinutes: 30,
      defaultAutoValidationThreshold: 0,
      reminderHoursBefore: [24, 2],
      maxContainersPerBooking: 10,
    }
  );
}

// ============================================================================
// BOOKING CANCELLATION (No window restriction for carriers)
// ============================================================================

/**
 * Check if a booking can be cancelled
 * Note: Per new requirements, carriers can cancel anytime (no cancellation window)
 */
export async function canCancelBooking(
  ctx: QueryCtx,
  bookingId: Id<"bookings">
): Promise<{ canCancel: boolean; reason?: string }> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) {
    return { canCancel: false, reason: "Réservation introuvable" };
  }

  // Only pending or confirmed bookings can be cancelled
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return {
      canCancel: false,
      reason: `Une réservation avec le statut "${booking.status}" ne peut pas être annulée`,
    };
  }

  // No cancellation window restriction - carriers can cancel anytime
  return { canCancel: true };
}

// ============================================================================
// BOOKING HISTORY (Internal mutations)
// ============================================================================

/**
 * Internal mutation to record booking history
 */
export const recordHistory = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    changeType: v.union(
      v.literal("created"),
      v.literal("status_changed"),
      v.literal("time_slot_changed"),
      v.literal("truck_changed"),
      v.literal("driver_updated"),
      v.literal("details_updated")
    ),
    previousValue: v.optional(v.string()),
    newValue: v.string(),
    changedBy: v.string(),
    note: v.optional(v.string()),
    requiredRebook: v.boolean(),
  },
  returns: v.id("bookingHistory"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookingHistory", {
      bookingId: args.bookingId,
      changeType: args.changeType,
      previousValue: args.previousValue,
      newValue: args.newValue,
      changedAt: Date.now(),
      changedBy: args.changedBy,
      note: args.note,
      requiredRebook: args.requiredRebook,
    });
  },
});

/**
 * Internal query to get booking history
 */
export const getHistory = internalQuery({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.array(
    v.object({
      _id: v.id("bookingHistory"),
      _creationTime: v.number(),
      changeType: v.string(),
      previousValue: v.optional(v.string()),
      newValue: v.string(),
      changedAt: v.number(),
      changedBy: v.string(),
      note: v.optional(v.string()),
      requiredRebook: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("bookingHistory")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .order("desc")
      .collect();

    return history.map((h) => ({
      _id: h._id,
      _creationTime: h._creationTime,
      changeType: h.changeType,
      previousValue: h.previousValue,
      newValue: h.newValue,
      changedAt: h.changedAt,
      changedBy: h.changedBy,
      note: h.note,
      requiredRebook: h.requiredRebook,
    }));
  },
});

// ============================================================================
// CONTAINER VALIDATION
// ============================================================================

/**
 * Validate that all containers belong to the carrier and are available
 */
export async function validateContainersForBooking(
  ctx: QueryCtx,
  containerIds: Id<"containers">[],
  carrierId: string,
  maxContainers: number
): Promise<{ valid: boolean; reason?: string; containers?: Doc<"containers">[] }> {
  if (containerIds.length === 0) {
    return { valid: false, reason: "Au moins un conteneur est requis" };
  }

  if (containerIds.length > maxContainers) {
    return {
      valid: false,
      reason: `Maximum ${maxContainers} conteneurs par réservation`,
    };
  }

  // Check for duplicates
  const uniqueIds = new Set(containerIds.map((id) => id.toString()));
  if (uniqueIds.size !== containerIds.length) {
    return { valid: false, reason: "Conteneurs en double détectés" };
  }

  const containers: Doc<"containers">[] = [];

  for (const containerId of containerIds) {
    const container = await ctx.db.get(containerId);
    
    if (!container) {
      return { valid: false, reason: `Conteneur ${containerId} introuvable` };
    }

    if (!container.isActive) {
      return {
        valid: false,
        reason: `Conteneur ${container.containerNumber} n'est pas actif`,
      };
    }

    if (container.ownerId !== carrierId) {
      return {
        valid: false,
        reason: `Conteneur ${container.containerNumber} n'appartient pas à ce transporteur`,
      };
    }

    if (container.bookingId) {
      return {
        valid: false,
        reason: `Conteneur ${container.containerNumber} est déjà associé à une réservation`,
      };
    }

    containers.push(container);
  }

  return { valid: true, containers };
}

/**
 * Associate containers with a booking
 */
export async function associateContainersWithBooking(
  ctx: MutationCtx,
  containerIds: Id<"containers">[],
  bookingId: Id<"bookings">
): Promise<void> {
  const now = Date.now();
  
  for (const containerId of containerIds) {
    await ctx.db.patch(containerId, {
      bookingId,
      updatedAt: now,
    });
  }
}

/**
 * Disassociate containers from a booking (on cancellation/rejection)
 */
export async function disassociateContainersFromBooking(
  ctx: MutationCtx,
  bookingId: Id<"bookings">
): Promise<void> {
  const containers = await ctx.db
    .query("containers")
    .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
    .collect();

  const now = Date.now();
  
  for (const container of containers) {
    await ctx.db.patch(container._id, {
      bookingId: undefined,
      updatedAt: now,
    });
  }
}
