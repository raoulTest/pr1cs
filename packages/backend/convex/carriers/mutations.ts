/**
 * Carrier Mutations
 * 
 * Updated for new schema:
 * - No carrierCompanies or carrierUsers tables
 * - Carriers are users with role="carrier"
 * - Trucks and containers are owned directly by carrier users via ownerId
 * - This file now handles carrier profile operations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
} from "../lib/permissions";
import {
  notificationChannelValidator,
} from "../lib/validators";

/**
 * Update carrier profile (carrier can update their own profile)
 */
export const updateProfile = mutation({
  args: {
    notificationChannel: v.optional(notificationChannelValidator),
    phone: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    // Find user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    if (!profile) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Profil utilisateur introuvable",
      });
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };

    if (args.notificationChannel !== undefined) {
      updates.notificationChannel = args.notificationChannel;
    }
    if (args.phone !== undefined) {
      updates.phone = args.phone;
    }

    await ctx.db.patch(profile._id, updates);
    return null;
  },
});

/**
 * Get carrier stats (for carrier dashboard)
 * Returns counts of trucks, containers, and bookings
 */
export const getMyStats = mutation({
  args: {},
  returns: v.object({
    truckCount: v.number(),
    containerCount: v.number(),
    availableContainerCount: v.number(),
    pendingBookings: v.number(),
    confirmedBookings: v.number(),
    consumedBookings: v.number(),
  }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    // Count trucks
    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_owner_and_active", (q) =>
        q.eq("ownerId", user.userId).eq("isActive", true)
      )
      .collect();

    // Count containers
    const containers = await ctx.db
      .query("containers")
      .withIndex("by_owner_and_active", (q) =>
        q.eq("ownerId", user.userId).eq("isActive", true)
      )
      .collect();

    const availableContainers = containers.filter(c => !c.bookingId);

    // Count bookings by status
    const pendingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_carrier_and_status", (q) =>
        q.eq("carrierId", user.userId).eq("status", "pending")
      )
      .collect();

    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_carrier_and_status", (q) =>
        q.eq("carrierId", user.userId).eq("status", "confirmed")
      )
      .collect();

    const consumedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_carrier_and_status", (q) =>
        q.eq("carrierId", user.userId).eq("status", "consumed")
      )
      .collect();

    return {
      truckCount: trucks.length,
      containerCount: containers.length,
      availableContainerCount: availableContainers.length,
      pendingBookings: pendingBookings.length,
      confirmedBookings: confirmedBookings.length,
      consumedBookings: consumedBookings.length,
    };
  },
});

/**
 * Admin: Update carrier user role/status
 * Only port_admin can change user roles
 */
export const adminUpdateCarrier = mutation({
  args: {
    userId: v.string(),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // This would integrate with Better Auth to update user status
    // For now, we update the user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Profil utilisateur introuvable",
      });
    }

    // Note: In a full implementation, this would also call Better Auth
    // to ban/unban the user or update their account status
    await ctx.db.patch(profile._id, {
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Admin: List all carriers with their stats
 */
export const adminListCarriers = mutation({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(v.object({
    userId: v.string(),
    truckCount: v.number(),
    containerCount: v.number(),
    bookingCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    // Get all user profiles and filter for carriers
    // In production, this would query Better Auth users with role="carrier"
    // For now, we look at users who have trucks (carriers)
    const allTrucks = await ctx.db
      .query("trucks")
      .withIndex("by_owner")
      .collect();

    // Get unique carrier userIds
    const carrierIds = [...new Set(allTrucks.map(t => t.ownerId))];
    const paginatedCarrierIds = carrierIds.slice(offset, offset + limit);

    const results = await Promise.all(
      paginatedCarrierIds.map(async (carrierId) => {
        const trucks = await ctx.db
          .query("trucks")
          .withIndex("by_owner_and_active", (q) =>
            q.eq("ownerId", carrierId).eq("isActive", true)
          )
          .collect();

        const containers = await ctx.db
          .query("containers")
          .withIndex("by_owner_and_active", (q) =>
            q.eq("ownerId", carrierId).eq("isActive", true)
          )
          .collect();

        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_carrier", (q) => q.eq("carrierId", carrierId))
          .collect();

        return {
          userId: carrierId,
          truckCount: trucks.length,
          containerCount: containers.length,
          bookingCount: bookings.length,
        };
      })
    );

    return results;
  },
});
