/**
 * System Configuration Queries
 * 
 * Updated: Removed cancellationWindowHours (carriers can cancel anytime)
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
      maxAdvanceBookingDays: v.number(),
      minAdvanceBookingHours: v.number(),
      noShowGracePeriodMinutes: v.number(),
      defaultAutoValidationThreshold: v.number(),
      reminderHoursBefore: v.array(v.number()),
      maxContainersPerBooking: v.number(),
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
      maxAdvanceBookingDays: config.maxAdvanceBookingDays,
      minAdvanceBookingHours: config.minAdvanceBookingHours,
      noShowGracePeriodMinutes: config.noShowGracePeriodMinutes,
      defaultAutoValidationThreshold: config.defaultAutoValidationThreshold,
      reminderHoursBefore: config.reminderHoursBefore,
      maxContainersPerBooking: config.maxContainersPerBooking,
      updatedAt: config.updatedAt,
    };
  },
});

/**
 * Check if cancellation is allowed
 * Note: Carriers can now cancel anytime, so this always returns true.
 * Kept for backwards compatibility but simplified.
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
  handler: async (_ctx, args) => {
    // Carriers can cancel anytime - no restrictions
    // Calculate hours remaining for informational purposes
    const slotDateTime = new Date(`${args.slotDate}T${args.slotStartTime}:00`);
    const now = new Date();
    const hoursUntilSlot =
      (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return { 
      allowed: true, 
      hoursRemaining: Math.max(0, hoursUntilSlot),
    };
  },
});
