/**
 * System Configuration Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAnyRole } from "../lib/permissions";

/**
 * Get system configuration
 */
export const get = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("systemConfig"),
      cancellationWindowHours: v.number(),
      maxAdvanceBookingDays: v.number(),
      minAdvanceBookingHours: v.number(),
      reminderHoursBefore: v.array(v.number()),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    const config = await ctx.db.query("systemConfig").first();
    if (!config) return null;

    return {
      _id: config._id,
      cancellationWindowHours: config.cancellationWindowHours,
      maxAdvanceBookingDays: config.maxAdvanceBookingDays,
      minAdvanceBookingHours: config.minAdvanceBookingHours,
      reminderHoursBefore: config.reminderHoursBefore,
      updatedAt: config.updatedAt,
    };
  },
});

/**
 * Check if cancellation is allowed based on time before slot
 */
export const canCancelBooking = query({
  args: {
    slotDate: v.string(), // YYYY-MM-DD
    slotStartTime: v.string(), // HH:mm
  },
  returns: v.object({
    allowed: v.boolean(),
    reason: v.optional(v.string()),
    hoursRemaining: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const config = await ctx.db.query("systemConfig").first();

    // If no config or cancellation window disabled, allow
    if (!config || config.cancellationWindowHours <= 0) {
      return { allowed: true };
    }

    // Calculate time until slot
    const slotDateTime = new Date(`${args.slotDate}T${args.slotStartTime}:00`);
    const now = new Date();
    const hoursUntilSlot =
      (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSlot < config.cancellationWindowHours) {
      return {
        allowed: false,
        reason: `Cancellation must be done at least ${config.cancellationWindowHours} hours before the time slot`,
        hoursRemaining: Math.max(0, hoursUntilSlot),
      };
    }

    return { allowed: true, hoursRemaining: hoursUntilSlot };
  },
});
