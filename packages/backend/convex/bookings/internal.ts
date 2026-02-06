/**
 * Internal Booking Functions
 * Utility functions for booking reference generation and QR codes
 */
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Generate a unique booking reference
 * Format: BK-YYYYMMDD-XXXX (e.g., BK-20240115-0001)
 */
export async function generateBookingReference(
  ctx: MutationCtx | QueryCtx
): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");

  // Find the highest reference number for today
  const todayPrefix = `BK-${dateStr}-`;

  // Get all bookings with today's date prefix
  const todayBookings = await ctx.db
    .query("bookings")
    .withIndex("by_reference")
    .filter((q) =>
      q.and(
        q.gte(q.field("bookingReference"), todayPrefix),
        q.lt(q.field("bookingReference"), `BK-${dateStr}0`)
      )
    )
    .collect();

  // Find the max sequence number
  let maxSeq = 0;
  for (const booking of todayBookings) {
    const match = booking.bookingReference.match(/BK-\d{8}-(\d{4})/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  // Generate new reference
  const newSeq = (maxSeq + 1).toString().padStart(4, "0");
  return `${todayPrefix}${newSeq}`;
}

/**
 * Generate a simple QR code data URL
 * Uses a basic SVG-based approach for simplicity
 * In production, consider using a proper QR library in an action
 */
export function generateQRCodePlaceholder(bookingReference: string): string {
  // For now, return a placeholder data URL
  // In production, use an action with a QR library like 'qrcode'
  // to generate actual QR codes
  return `qr:${bookingReference}`;
}

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
    return { valid: false, reason: "Truck not found" };
  }

  const gate = await ctx.db.get(gateId);
  if (!gate) {
    return { valid: false, reason: "Gate not found" };
  }

  // Check truck type
  if (!gate.allowedTruckTypes.includes(truck.truckType)) {
    return {
      valid: false,
      reason: `Truck type "${truck.truckType}" is not allowed at this gate. Allowed types: ${gate.allowedTruckTypes.join(", ")}`,
    };
  }

  // Check truck class
  if (!gate.allowedTruckClasses.includes(truck.truckClass)) {
    return {
      valid: false,
      reason: `Truck class "${truck.truckClass}" is not allowed at this gate. Allowed classes: ${gate.allowedTruckClasses.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get system configuration for booking rules
 */
export async function getSystemConfig(ctx: QueryCtx) {
  const config = await ctx.db.query("systemConfig").first();

  // Return defaults if no config exists
  return (
    config ?? {
      cancellationWindowHours: 24,
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      reminderHoursBefore: [24, 2],
    }
  );
}

/**
 * Check if a booking can be cancelled based on cancellation policy
 */
export async function canCancelBooking(
  ctx: QueryCtx,
  bookingId: Id<"bookings">
): Promise<{ canCancel: boolean; reason?: string }> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) {
    return { canCancel: false, reason: "Booking not found" };
  }

  // Only pending or confirmed bookings can be cancelled
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return {
      canCancel: false,
      reason: `Booking with status "${booking.status}" cannot be cancelled`,
    };
  }

  // Get time slot to check timing
  const timeSlot = await ctx.db.get(booking.timeSlotId);
  if (!timeSlot) {
    return { canCancel: true }; // Allow cancellation if time slot deleted
  }

  // Get system config
  const config = await getSystemConfig(ctx);

  // If cancellation window is disabled (0 or -1), always allow
  if (config.cancellationWindowHours <= 0) {
    return { canCancel: true };
  }

  // Calculate slot start time
  const slotDateTime = new Date(`${timeSlot.date}T${timeSlot.startTime}`);
  const now = new Date();
  const hoursUntilSlot =
    (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Check if within cancellation window
  if (hoursUntilSlot < config.cancellationWindowHours) {
    return {
      canCancel: false,
      reason: `Cannot cancel bookings less than ${config.cancellationWindowHours} hours before the time slot`,
    };
  }

  return { canCancel: true };
}
