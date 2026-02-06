/**
 * Truck Mutations
 * CRUD operations for managing trucks in a carrier's fleet
 * 
 * Updated for new schema:
 * - Trucks are owned directly by carrier users (ownerId), not carrier companies
 * - No transfer function (ownership is assigned at creation)
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  requireTruckAccess,
  isPortAdmin,
} from "../lib/permissions";
import {
  truckInputValidator,
  truckTypeValidator,
  truckClassValidator,
} from "../lib/validators";

/**
 * Create a new truck
 * Port admins can create trucks for any carrier
 * Carriers can only create trucks for themselves
 */
export const create = mutation({
  args: {
    ...truckInputValidator.fields,
    // Optional: for port admins to assign to specific carrier
    ownerId: v.optional(v.string()),
  },
  returns: v.id("trucks"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    // Determine owner
    let ownerId: string;
    if (isPortAdmin(user) && args.ownerId) {
      // Admin creating truck for specific carrier
      ownerId = args.ownerId;
    } else if (user.apcsRole === "carrier") {
      // Carrier creating truck for themselves
      ownerId = user.userId;
    } else {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "ownerId est requis pour les administrateurs",
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
        message: `Un camion avec la plaque d'immatriculation "${args.licensePlate}" existe deja`,
      });
    }

    // Validate year if provided
    if (args.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (args.year < 1900 || args.year > currentYear + 1) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "Annee du camion invalide",
        });
      }
    }

    // Validate max weight if provided
    if (args.maxWeight !== undefined && args.maxWeight <= 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Le poids maximal doit etre un nombre positif",
      });
    }

    const now = Date.now();

    const truckId = await ctx.db.insert("trucks", {
      ownerId,
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
        message: "Camion introuvable",
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
            message: `Un camion avec la plaque d'immatriculation "${args.licensePlate}" existe deja`,
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
          message: "Annee du camion invalide",
        });
      }
    }

    // Validate max weight if provided
    if (args.maxWeight !== undefined && args.maxWeight <= 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Le poids maximal doit etre un nombre positif",
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
        message: "Camion introuvable",
      });
    }

    if (!truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Le camion est deja inactif",
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
        message: `Impossible de desactiver un camion avec ${pendingOrConfirmed.length} reservation(s) active(s). Annulez d'abord les reservations.`,
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
        message: "Camion introuvable",
      });
    }

    if (truck.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Le camion est deja actif",
      });
    }

    await ctx.db.patch(args.truckId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});
