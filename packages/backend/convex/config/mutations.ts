/**
 * System Configuration Mutations
 * 
 * Updated: Removed cancellationWindowHours (carriers can cancel anytime)
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireRole } from "../lib/permissions";

/**
 * Initialize or update system configuration
 */
export const upsert = mutation({
  args: {
    maxAdvanceBookingDays: v.optional(v.number()),
    minAdvanceBookingHours: v.optional(v.number()),
    noShowGracePeriodMinutes: v.optional(v.number()),
    defaultAutoValidationThreshold: v.optional(v.number()),
    reminderHoursBefore: v.optional(v.array(v.number())),
    maxContainersPerBooking: v.optional(v.number()),
  },
  returns: v.id("systemConfig"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const now = Date.now();
    const existing = await ctx.db.query("systemConfig").first();

    if (existing) {
      // Update existing config
      const updates: Record<string, unknown> = {
        updatedAt: now,
        updatedBy: user.userId,
      };

      if (args.maxAdvanceBookingDays !== undefined) {
        updates.maxAdvanceBookingDays = args.maxAdvanceBookingDays;
      }
      if (args.minAdvanceBookingHours !== undefined) {
        updates.minAdvanceBookingHours = args.minAdvanceBookingHours;
      }
      if (args.noShowGracePeriodMinutes !== undefined) {
        updates.noShowGracePeriodMinutes = args.noShowGracePeriodMinutes;
      }
      if (args.defaultAutoValidationThreshold !== undefined) {
        updates.defaultAutoValidationThreshold = args.defaultAutoValidationThreshold;
      }
      if (args.reminderHoursBefore !== undefined) {
        updates.reminderHoursBefore = args.reminderHoursBefore;
      }
      if (args.maxContainersPerBooking !== undefined) {
        updates.maxContainersPerBooking = args.maxContainersPerBooking;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new config with defaults
    return await ctx.db.insert("systemConfig", {
      maxAdvanceBookingDays: args.maxAdvanceBookingDays ?? 30,
      minAdvanceBookingHours: args.minAdvanceBookingHours ?? 2,
      noShowGracePeriodMinutes: args.noShowGracePeriodMinutes ?? 30,
      defaultAutoValidationThreshold: args.defaultAutoValidationThreshold ?? 50,
      reminderHoursBefore: args.reminderHoursBefore ?? [24, 2],
      maxContainersPerBooking: args.maxContainersPerBooking ?? 10,
      updatedAt: now,
      updatedBy: user.userId,
    });
  },
});
