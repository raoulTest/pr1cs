/**
 * Capacity Management Utilities
 * Handles atomic capacity reservation and release for time slots
 */
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Check if a time slot has capacity and atomically reserve if available.
 * This prevents race conditions where two bookings might exceed capacity.
 *
 * @returns true if capacity was reserved, false if slot is full
 */
export async function checkAndReserveCapacity(
  ctx: MutationCtx,
  timeSlotId: Id<"timeSlots">
): Promise<boolean> {
  const timeSlot = await ctx.db.get(timeSlotId);
  if (!timeSlot) return false;

  // Check current capacity
  if (timeSlot.currentBookings >= timeSlot.maxCapacity) {
    return false;
  }

  // Atomically increment the counter
  await ctx.db.patch(timeSlotId, {
    currentBookings: timeSlot.currentBookings + 1,
    updatedAt: Date.now(),
  });

  return true;
}

/**
 * Release a capacity slot (on cancellation/rejection)
 */
export async function releaseCapacity(
  ctx: MutationCtx,
  timeSlotId: Id<"timeSlots">
): Promise<void> {
  const timeSlot = await ctx.db.get(timeSlotId);
  if (!timeSlot) return;

  await ctx.db.patch(timeSlotId, {
    currentBookings: Math.max(0, timeSlot.currentBookings - 1),
    updatedAt: Date.now(),
  });
}

/**
 * Recalculate capacity for a time slot (for data consistency checks)
 * Should be used sparingly, mainly for migrations or repairs
 */
export async function recalculateCapacity(
  ctx: MutationCtx,
  timeSlotId: Id<"timeSlots">
): Promise<number> {
  // Count active bookings (pending, confirmed)
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_time_slot", (q) => q.eq("timeSlotId", timeSlotId))
    .collect();

  const activeCount = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  ).length;

  await ctx.db.patch(timeSlotId, {
    currentBookings: activeCount,
    updatedAt: Date.now(),
  });

  return activeCount;
}

/**
 * Get available capacity for a time slot (for queries)
 */
export async function getAvailableCapacity(
  ctx: QueryCtx,
  timeSlotId: Id<"timeSlots">
): Promise<{ available: number; total: number; booked: number }> {
  const timeSlot = await ctx.db.get(timeSlotId);
  if (!timeSlot) {
    return { available: 0, total: 0, booked: 0 };
  }

  return {
    available: Math.max(0, timeSlot.maxCapacity - timeSlot.currentBookings),
    total: timeSlot.maxCapacity,
    booked: timeSlot.currentBookings,
  };
}

/**
 * Check if a time slot has availability without reserving
 */
export async function hasAvailability(
  ctx: QueryCtx,
  timeSlotId: Id<"timeSlots">
): Promise<boolean> {
  const capacity = await getAvailableCapacity(ctx, timeSlotId);
  return capacity.available > 0;
}

/**
 * Get capacity utilization percentage
 */
export async function getUtilizationPercent(
  ctx: QueryCtx,
  timeSlotId: Id<"timeSlots">
): Promise<number> {
  const capacity = await getAvailableCapacity(ctx, timeSlotId);
  if (capacity.total === 0) return 0;
  return Math.round((capacity.booked / capacity.total) * 100);
}
