/**
 * System Configuration Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireRole } from "../lib/permissions";

/**
 * Initialize or update system configuration
 */
export const upsert = mutation({
  args: {
    cancellationWindowHours: v.optional(v.number()),
    maxAdvanceBookingDays: v.optional(v.number()),
    minAdvanceBookingHours: v.optional(v.number()),
    reminderHoursBefore: v.optional(v.array(v.number())),
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

      if (args.cancellationWindowHours !== undefined) {
        updates.cancellationWindowHours = args.cancellationWindowHours;
      }
      if (args.maxAdvanceBookingDays !== undefined) {
        updates.maxAdvanceBookingDays = args.maxAdvanceBookingDays;
      }
      if (args.minAdvanceBookingHours !== undefined) {
        updates.minAdvanceBookingHours = args.minAdvanceBookingHours;
      }
      if (args.reminderHoursBefore !== undefined) {
        updates.reminderHoursBefore = args.reminderHoursBefore;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new config with defaults
    return await ctx.db.insert("systemConfig", {
      cancellationWindowHours: args.cancellationWindowHours ?? 24,
      maxAdvanceBookingDays: args.maxAdvanceBookingDays ?? 30,
      minAdvanceBookingHours: args.minAdvanceBookingHours ?? 2,
      reminderHoursBefore: args.reminderHoursBefore ?? [24, 2],
      updatedAt: now,
      updatedBy: user.userId,
    });
  },
});
