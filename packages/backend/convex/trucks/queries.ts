/**
 * Truck Queries
 * 
 * Updated for new schema:
 * - Trucks are owned directly by carrier users (ownerId), not carrier companies
 * - Uses by_owner and by_owner_and_active indexes
 * - No carrierCompanies table
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  isPortAdmin,
  isCarrier,
} from "../lib/permissions";
import { truckTypeValidator, truckClassValidator } from "../lib/validators";
import { authComponent } from "../auth";

/**
 * List trucks for a carrier (by owner userId)
 */
export const listByOwner = query({
  args: {
    ownerId: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("trucks"),
      _creationTime: v.number(),
      licensePlate: v.string(),
      truckType: truckTypeValidator,
      truckClass: truckClassValidator,
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      year: v.optional(v.number()),
      maxWeight: v.optional(v.number()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Port admins can view any carrier's trucks
    // Carriers can only view their own trucks
    if (!isPortAdmin(user) && user.userId !== args.ownerId) {
      return [];
    }

    let trucks;

    if (args.activeOnly) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner_and_active", (q) =>
          q.eq("ownerId", args.ownerId).eq("isActive", true)
        )
        .collect();
    } else {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
        .collect();
    }

    return trucks.map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
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
 * Get my trucks (carrier shortcut)
 */
export const listMyTrucks = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("trucks"),
      _creationTime: v.number(),
      licensePlate: v.string(),
      truckType: truckTypeValidator,
      truckClass: truckClassValidator,
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      year: v.optional(v.number()),
      maxWeight: v.optional(v.number()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Only carriers can use this endpoint
    if (!isCarrier(user)) {
      return [];
    }

    let trucks;

    if (args.activeOnly) {
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
      _creationTime: t._creationTime,
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
 * Get a single truck
 */
export const get = query({
  args: { truckId: v.id("trucks") },
  returns: v.union(
    v.object({
      _id: v.id("trucks"),
      _creationTime: v.number(),
      ownerId: v.string(),
      ownerName: v.optional(v.string()),
      licensePlate: v.string(),
      truckType: truckTypeValidator,
      truckClass: truckClassValidator,
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      year: v.optional(v.number()),
      maxWeight: v.optional(v.number()),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const truck = await ctx.db.get(args.truckId);
    if (!truck) return null;

    // Port admins can view any truck
    // Carriers can only view their own trucks
    if (!isPortAdmin(user) && user.userId !== truck.ownerId) {
      return null;
    }

    // Get owner info from Better Auth
    const owner = await authComponent.getAnyUserById(ctx, truck.ownerId);

    return {
      _id: truck._id,
      _creationTime: truck._creationTime,
      ownerId: truck.ownerId,
      ownerName: owner?.name,
      licensePlate: truck.licensePlate,
      truckType: truck.truckType,
      truckClass: truck.truckClass,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      maxWeight: truck.maxWeight,
      isActive: truck.isActive,
      createdAt: truck.createdAt,
      updatedAt: truck.updatedAt,
    };
  },
});

/**
 * Get truck by license plate
 */
export const getByLicensePlate = query({
  args: { licensePlate: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("trucks"),
      ownerId: v.string(),
      licensePlate: v.string(),
      truckType: truckTypeValidator,
      truckClass: truckClassValidator,
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const truck = await ctx.db
      .query("trucks")
      .withIndex("by_license_plate", (q) =>
        q.eq("licensePlate", args.licensePlate.toUpperCase().trim())
      )
      .unique();

    if (!truck) return null;

    // Port admins can view any truck
    // Carriers can only view their own trucks
    if (!isPortAdmin(user) && user.userId !== truck.ownerId) {
      return null;
    }

    return {
      _id: truck._id,
      ownerId: truck.ownerId,
      licensePlate: truck.licensePlate,
      truckType: truck.truckType,
      truckClass: truck.truckClass,
      isActive: truck.isActive,
    };
  },
});

/**
 * List all trucks (admin only)
 */
export const listAll = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    truckType: v.optional(truckTypeValidator),
    truckClass: v.optional(truckClassValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("trucks"),
      _creationTime: v.number(),
      ownerId: v.string(),
      ownerName: v.optional(v.string()),
      licensePlate: v.string(),
      truckType: truckTypeValidator,
      truckClass: truckClassValidator,
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Only port admins can list all trucks
    if (!isPortAdmin(user)) {
      return [];
    }

    let trucks;

    if (args.truckType) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_type", (q) => q.eq("truckType", args.truckType!))
        .collect();
    } else if (args.truckClass) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_class", (q) => q.eq("truckClass", args.truckClass!))
        .collect();
    } else {
      trucks = await ctx.db.query("trucks").collect();
    }

    // Filter by active status
    if (args.activeOnly) {
      trucks = trucks.filter((t) => t.isActive);
    }

    // Get owner names
    const ownerIds = [...new Set(trucks.map((t) => t.ownerId))];
    const ownerMap = new Map<string, string>();

    for (const ownerId of ownerIds) {
      const owner = await authComponent.getAnyUserById(ctx, ownerId);
      if (owner?.name) {
        ownerMap.set(ownerId, owner.name);
      }
    }

    return trucks.map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
      ownerId: t.ownerId,
      ownerName: ownerMap.get(t.ownerId),
      licensePlate: t.licensePlate,
      truckType: t.truckType,
      truckClass: t.truckClass,
      make: t.make,
      model: t.model,
      isActive: t.isActive,
    }));
  },
});
