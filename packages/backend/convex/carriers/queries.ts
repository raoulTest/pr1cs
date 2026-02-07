/**
 * Carrier Queries
 * 
 * Updated for new schema:
 * - No carrierCompanies or carrierUsers tables
 * - Carriers are users with role="carrier"
 * - Trucks and containers are owned directly by carrier users via ownerId
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  isPortAdmin,
  isCarrier,
} from "../lib/permissions";
import { notificationChannelValidator } from "../lib/validators";
import { authComponent } from "../auth";

/**
 * Get current carrier's profile and stats
 */
export const getMyProfile = query({
  args: {},
  returns: v.union(
    v.object({
      userId: v.string(),
      notificationChannel: notificationChannelValidator,
      phone: v.optional(v.string()),
      truckCount: v.number(),
      containerCount: v.number(),
      availableContainerCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!isCarrier(user)) {
      return null;
    }

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    if (!profile) return null;

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

    return {
      userId: user.userId,
      notificationChannel: profile.notificationChannel,
      phone: profile.phone,
      truckCount: trucks.length,
      containerCount: containers.length,
      availableContainerCount: availableContainers.length,
    };
  },
});

/**
 * List all carriers (admin only)
 * Returns carriers with their truck and container counts
 */
export const listCarriers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      truckCount: v.number(),
      containerCount: v.number(),
      bookingCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    // Get all unique carrier userIds from trucks
    const allTrucks = await ctx.db
      .query("trucks")
      .withIndex("by_owner")
      .collect();

    const carrierIds = [...new Set(allTrucks.map(t => t.ownerId))];
    const paginatedCarrierIds = carrierIds.slice(offset, offset + limit);

    const results = await Promise.all(
      paginatedCarrierIds.map(async (carrierId) => {
        // Get user info from Better Auth
        const authUser = await authComponent.getAnyUserById(ctx, carrierId);
        
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
          name: authUser?.name,
          email: authUser?.email,
          truckCount: trucks.length,
          containerCount: containers.length,
          bookingCount: bookings.length,
        };
      })
    );

    return results;
  },
});

/**
 * Get carrier details by userId (admin only)
 */
export const getCarrier = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      truckCount: v.number(),
      containerCount: v.number(),
      pendingBookings: v.number(),
      confirmedBookings: v.number(),
      consumedBookings: v.number(),
      cancelledBookings: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    
    // Only admins can view other carriers, carriers can view themselves
    if (!isPortAdmin(user) && user.userId !== args.userId) {
      return null;
    }

    // Count trucks
    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_owner_and_active", (q) =>
        q.eq("ownerId", args.userId).eq("isActive", true)
      )
      .collect();

    // Count containers
    const containers = await ctx.db
      .query("containers")
      .withIndex("by_owner_and_active", (q) =>
        q.eq("ownerId", args.userId).eq("isActive", true)
      )
      .collect();

    // Count bookings by status
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_carrier", (q) => q.eq("carrierId", args.userId))
      .collect();

    const pendingBookings = allBookings.filter(b => b.status === "pending").length;
    const confirmedBookings = allBookings.filter(b => b.status === "confirmed").length;
    const consumedBookings = allBookings.filter(b => b.status === "consumed").length;
    const cancelledBookings = allBookings.filter(b => b.status === "cancelled").length;

    return {
      userId: args.userId,
      truckCount: trucks.length,
      containerCount: containers.length,
      pendingBookings,
      confirmedBookings,
      consumedBookings,
      cancelledBookings,
    };
  },
});

/**
 * List carrier's trucks
 */
export const listMyTrucks = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("trucks"),
      licensePlate: v.string(),
      truckType: v.string(),
      truckClass: v.string(),
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      year: v.optional(v.number()),
      maxWeight: v.optional(v.number()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    const activeOnly = args.activeOnly ?? true;

    let trucks;
    if (activeOnly) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner_and_active", (q) =>
          q.eq("ownerId", user.userId).eq("isActive", true)
        )
        .collect();
    } else {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner", (q) => q.eq("ownerId", user.userId))
        .collect();
    }

    return trucks.map((t) => ({
      _id: t._id,
      licensePlate: t.licensePlate,
      truckType: t.truckType,
      truckClass: t.truckClass,
      make: t.make,
      model: t.model,
      year: t.year,
      maxWeight: t.maxWeight,
      isActive: t.isActive,
    }));
  },
});

/**
 * List carrier's containers
 */
export const listMyContainers = query({
  args: {
    operationType: v.optional(v.union(v.literal("pick_up"), v.literal("drop_off"))),
    availableOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("containers"),
      containerNumber: v.string(),
      containerType: v.string(),
      dimensions: v.string(),
      weightClass: v.string(),
      operationType: v.string(),
      isEmpty: v.boolean(),
      isBooked: v.boolean(),
      readyDate: v.optional(v.number()),
      departureDate: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["carrier"]);

    let containers = await ctx.db
      .query("containers")
      .withIndex("by_owner_and_active", (q) =>
        q.eq("ownerId", user.userId).eq("isActive", true)
      )
      .collect();

    // Filter by operation type if provided
    if (args.operationType) {
      containers = containers.filter(c => c.operationType === args.operationType);
    }

    // Filter to available only (not in a booking)
    if (args.availableOnly) {
      containers = containers.filter(c => !c.bookingId);
    }

    return containers.map((c) => ({
      _id: c._id,
      containerNumber: c.containerNumber,
      containerType: c.containerType,
      dimensions: c.dimensions,
      weightClass: c.weightClass,
      operationType: c.operationType,
      isEmpty: c.isEmpty,
      isBooked: !!c.bookingId,
      readyDate: c.readyDate,
      departureDate: c.departureDate,
    }));
  },
});
