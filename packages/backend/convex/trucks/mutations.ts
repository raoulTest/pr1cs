/**
 * Truck Mutations
 * CRUD operations for managing trucks in a carrier's fleet
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  canManageCarrier,
  requireCarrierManagement,
  requireTruckAccess,
  isPortAdmin,
} from "../lib/permissions";
import {
  truckInputValidator,
  truckTypeValidator,
  truckClassValidator,
} from "../lib/validators";

/**
 * Create a new truck for a carrier company
 * Port admins can create trucks for any carrier
 * Carrier company admins can create trucks for their own company
 */
export const create = mutation({
  args: truckInputValidator.fields,
  returns: v.id("trucks"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    // Check permission to manage this carrier
    const canManage = await canManageCarrier(ctx, user, args.carrierCompanyId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to add trucks to this company",
      });
    }

    // Verify carrier company exists and is active
    const carrier = await ctx.db.get(args.carrierCompanyId);
    if (!carrier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Carrier company not found",
      });
    }
    if (!carrier.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot add trucks to an inactive carrier company",
      });
    }

    // Check for duplicate license plate
    const existingTruck = await ctx.db
      .query("trucks")
      .withIndex("by_license_plate", (q) =>
        q.eq("licensePlate", args.licensePlate.toUpperCase().trim())
      )
      .unique();

    if (existingTruck) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: `A truck with license plate "${args.licensePlate}" already exists`,
      });
    }

    // Validate year if provided
    if (args.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (args.year < 1900 || args.year > currentYear + 1) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "Invalid truck year",
        });
      }
    }

    // Validate max weight if provided
    if (args.maxWeight !== undefined && args.maxWeight <= 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Max weight must be a positive number",
      });
    }

    const now = Date.now();

    const truckId = await ctx.db.insert("trucks", {
      carrierCompanyId: args.carrierCompanyId,
      licensePlate: args.licensePlate.toUpperCase().trim(),
      truckType: args.truckType,
      truckClass: args.truckClass,
      make: args.make?.trim(),
      model: args.model?.trim(),
      year: args.year,
      maxWeight: args.maxWeight,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });

    return truckId;
  },
});

/**
 * Update a truck's details
 */
export const update = mutation({
  args: {
    truckId: v.id("trucks"),
    licensePlate: v.optional(v.string()),
    truckType: v.optional(truckTypeValidator),
    truckClass: v.optional(truckClassValidator),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    maxWeight: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    // Check permission to manage this truck
    await requireTruckAccess(ctx, user, args.truckId);

    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Truck not found",
      });
    }

    // If updating license plate, check for duplicates
    if (args.licensePlate !== undefined) {
      const normalizedPlate = args.licensePlate.toUpperCase().trim();
      if (normalizedPlate !== truck.licensePlate) {
        const existingTruck = await ctx.db
          .query("trucks")
          .withIndex("by_license_plate", (q) =>
            q.eq("licensePlate", normalizedPlate)
          )
          .unique();

        if (existingTruck) {
          throw new ConvexError({
            code: "DUPLICATE",
            message: `A truck with license plate "${args.licensePlate}" already exists`,
          });
        }
      }
    }

    // Validate year if provided
    if (args.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (args.year < 1900 || args.year > currentYear + 1) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "Invalid truck year",
        });
      }
    }

    // Validate max weight if provided
    if (args.maxWeight !== undefined && args.maxWeight <= 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Max weight must be a positive number",
      });
    }

    // Build update object with only provided fields
    const updates: Partial<typeof truck> = {
      updatedAt: Date.now(),
    };

    if (args.licensePlate !== undefined) {
      updates.licensePlate = args.licensePlate.toUpperCase().trim();
    }
    if (args.truckType !== undefined) {
      updates.truckType = args.truckType;
    }
    if (args.truckClass !== undefined) {
      updates.truckClass = args.truckClass;
    }
    if (args.make !== undefined) {
      updates.make = args.make.trim() || undefined;
    }
    if (args.model !== undefined) {
      updates.model = args.model.trim() || undefined;
    }
    if (args.year !== undefined) {
      updates.year = args.year;
    }
    if (args.maxWeight !== undefined) {
      updates.maxWeight = args.maxWeight;
    }

    await ctx.db.patch(args.truckId, updates);

    return null;
  },
});

/**
 * Deactivate a truck (soft delete)
 * Deactivated trucks cannot be used for new bookings
 */
export const deactivate = mutation({
  args: {
    truckId: v.id("trucks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    // Check permission to manage this truck
    await requireTruckAccess(ctx, user, args.truckId);

    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Truck not found",
      });
    }

    if (!truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Truck is already inactive",
      });
    }

    // Check for active bookings (pending or confirmed)
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.truckId))
      .collect();

    const pendingOrConfirmed = activeBookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    );

    if (pendingOrConfirmed.length > 0) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot deactivate truck with ${pendingOrConfirmed.length} active booking(s). Cancel bookings first.`,
      });
    }

    await ctx.db.patch(args.truckId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reactivate a previously deactivated truck
 */
export const reactivate = mutation({
  args: {
    truckId: v.id("trucks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    // Check permission to manage this truck
    await requireTruckAccess(ctx, user, args.truckId);

    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Truck not found",
      });
    }

    if (truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Truck is already active",
      });
    }

    // Check if the carrier company is still active
    const carrier = await ctx.db.get(truck.carrierCompanyId);
    if (!carrier?.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot reactivate truck for an inactive carrier company",
      });
    }

    await ctx.db.patch(args.truckId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Transfer a truck to a different carrier company (port admin only)
 */
export const transfer = mutation({
  args: {
    truckId: v.id("trucks"),
    newCarrierCompanyId: v.id("carrierCompanies"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const truck = await ctx.db.get(args.truckId);
    if (!truck) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Truck not found",
      });
    }

    if (truck.carrierCompanyId === args.newCarrierCompanyId) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Truck is already assigned to this carrier company",
      });
    }

    // Verify new carrier exists and is active
    const newCarrier = await ctx.db.get(args.newCarrierCompanyId);
    if (!newCarrier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Target carrier company not found",
      });
    }
    if (!newCarrier.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot transfer truck to an inactive carrier company",
      });
    }

    // Check for active bookings
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_truck", (q) => q.eq("truckId", args.truckId))
      .collect();

    const pendingOrConfirmed = activeBookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    );

    if (pendingOrConfirmed.length > 0) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Cannot transfer truck with ${pendingOrConfirmed.length} active booking(s). Cancel or complete bookings first.`,
      });
    }

    await ctx.db.patch(args.truckId, {
      carrierCompanyId: args.newCarrierCompanyId,
      updatedAt: Date.now(),
    });

    return null;
  },
});
