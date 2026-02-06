/**
 * Truck Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  isPortAdmin,
  isCarrier,
  canViewCarrier,
} from "../lib/permissions";
import { truckTypeValidator, truckClassValidator } from "../lib/validators";

/**
 * List trucks for a carrier company
 */
export const listByCompany = query({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
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

    // Check access
    const canView = await canViewCarrier(ctx, user, args.carrierCompanyId);
    if (!canView) {
      return [];
    }

    let trucks;

    if (args.activeOnly) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_carrier_and_active", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId).eq("isActive", true)
        )
        .collect();
    } else {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId)
        )
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
 * Get my company's trucks (carrier shortcut)
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

    if (!isCarrier(user) || !user.carrierCompanyId) {
      return [];
    }

    let trucks;

    if (args.activeOnly) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_carrier_and_active", (q) =>
          q.eq("carrierCompanyId", user.carrierCompanyId!).eq("isActive", true)
        )
        .collect();
    } else {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", user.carrierCompanyId!)
        )
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
      carrierCompanyId: v.id("carrierCompanies"),
      carrierCompanyName: v.string(),
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

    // Check access
    const canView = await canViewCarrier(ctx, user, truck.carrierCompanyId);
    if (!canView) {
      return null;
    }

    const company = await ctx.db.get(truck.carrierCompanyId);

    return {
      _id: truck._id,
      _creationTime: truck._creationTime,
      carrierCompanyId: truck.carrierCompanyId,
      carrierCompanyName: company?.name ?? "Unknown",
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
      carrierCompanyId: v.id("carrierCompanies"),
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
        q.eq("licensePlate", args.licensePlate)
      )
      .unique();

    if (!truck) return null;

    // Check access
    const canView = await canViewCarrier(ctx, user, truck.carrierCompanyId);
    if (!canView && !isPortAdmin(user)) {
      return null;
    }

    return {
      _id: truck._id,
      carrierCompanyId: truck.carrierCompanyId,
      licensePlate: truck.licensePlate,
      truckType: truck.truckType,
      truckClass: truck.truckClass,
      isActive: truck.isActive,
    };
  },
});
