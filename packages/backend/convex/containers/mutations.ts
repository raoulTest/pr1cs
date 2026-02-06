/**
 * Container Mutations
 * CRUD operations for managing containers
 * 
 * Note: Containers are pre-seeded by admins and assigned to carriers.
 * Carriers can only update limited fields on their own containers.
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  isPortAdmin,
  canManageContainer,
} from "../lib/permissions";
import {
  containerInputValidator,
  containerTypeValidator,
  containerDimensionsValidator,
  containerWeightClassValidator,
  containerOperationValidator,
  isValidContainerNumber,
} from "../lib/validators";

/**
 * Create a new container (port admin only)
 * Containers are pre-seeded and assigned to carriers
 */
export const create = mutation({
  args: containerInputValidator.fields,
  returns: v.id("containers"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Validate container number format (ISO 6346)
    if (!isValidContainerNumber(args.containerNumber)) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Numero de conteneur invalide (format ISO 6346 requis: 4 lettres + 7 chiffres)",
      });
    }

    // Check for duplicate container number
    const existing = await ctx.db
      .query("containers")
      .withIndex("by_container_number", (q) =>
        q.eq("containerNumber", args.containerNumber.toUpperCase().trim())
      )
      .first();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "Ce numero de conteneur existe deja",
      });
    }

    const now = Date.now();
    const containerId = await ctx.db.insert("containers", {
      ownerId: args.ownerId,
      containerNumber: args.containerNumber.toUpperCase().trim(),
      containerType: args.containerType,
      dimensions: args.dimensions,
      weightClass: args.weightClass,
      operationType: args.operationType,
      isEmpty: args.isEmpty,
      readyDate: args.readyDate,
      departureDate: args.departureDate,
      notes: args.notes?.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return containerId;
  },
});

/**
 * Bulk create containers (port admin only)
 * Useful for importing pre-seeded data
 */
export const createBulk = mutation({
  args: {
    containers: v.array(containerInputValidator),
  },
  returns: v.array(v.id("containers")),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const containerIds: string[] = [];
    const now = Date.now();

    for (const containerData of args.containers) {
      // Validate container number format
      if (!isValidContainerNumber(containerData.containerNumber)) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Numero de conteneur invalide: ${containerData.containerNumber}`,
        });
      }

      // Check for duplicate
      const existing = await ctx.db
        .query("containers")
        .withIndex("by_container_number", (q) =>
          q.eq("containerNumber", containerData.containerNumber.toUpperCase().trim())
        )
        .first();

      if (existing) {
        throw new ConvexError({
          code: "DUPLICATE",
          message: `Numero de conteneur en double: ${containerData.containerNumber}`,
        });
      }

      const containerId = await ctx.db.insert("containers", {
        ownerId: containerData.ownerId,
        containerNumber: containerData.containerNumber.toUpperCase().trim(),
        containerType: containerData.containerType,
        dimensions: containerData.dimensions,
        weightClass: containerData.weightClass,
        operationType: containerData.operationType,
        isEmpty: containerData.isEmpty,
        readyDate: containerData.readyDate,
        departureDate: containerData.departureDate,
        notes: containerData.notes?.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      containerIds.push(containerId);
    }

    return containerIds as any;
  },
});

/**
 * Update container details
 * Port admins can update all fields
 * Carriers can only update limited fields on their own containers
 */
export const update = mutation({
  args: {
    containerId: v.id("containers"),
    // Carrier-updatable fields
    isEmpty: v.optional(v.boolean()),
    readyDate: v.optional(v.number()),
    departureDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    // Admin-only fields
    ownerId: v.optional(v.string()),
    containerType: v.optional(containerTypeValidator),
    dimensions: v.optional(containerDimensionsValidator),
    weightClass: v.optional(containerWeightClassValidator),
    operationType: v.optional(containerOperationValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "carrier"]);

    const container = await ctx.db.get(args.containerId);
    if (!container) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conteneur introuvable",
      });
    }

    // Check permission
    const canManage = await canManageContainer(ctx, user, args.containerId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas la permission de modifier ce conteneur",
      });
    }

    // Cannot update container if it's in an active booking
    if (container.bookingId) {
      const booking = await ctx.db.get(container.bookingId);
      if (booking && (booking.status === "pending" || booking.status === "confirmed")) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Impossible de modifier un conteneur dans une reservation active",
        });
      }
    }

    // Build update object
    const updates: Partial<typeof container> = {
      updatedAt: Date.now(),
    };

    // Carrier-updatable fields
    if (args.isEmpty !== undefined) updates.isEmpty = args.isEmpty;
    if (args.readyDate !== undefined) updates.readyDate = args.readyDate;
    if (args.departureDate !== undefined) updates.departureDate = args.departureDate;
    if (args.notes !== undefined) updates.notes = args.notes.trim() || undefined;

    // Admin-only fields
    if (isPortAdmin(user)) {
      if (args.ownerId !== undefined) updates.ownerId = args.ownerId;
      if (args.containerType !== undefined) updates.containerType = args.containerType;
      if (args.dimensions !== undefined) updates.dimensions = args.dimensions;
      if (args.weightClass !== undefined) updates.weightClass = args.weightClass;
      if (args.operationType !== undefined) updates.operationType = args.operationType;
    } else {
      // Carriers cannot change these fields
      if (args.ownerId || args.containerType || args.dimensions || args.weightClass || args.operationType) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Les transporteurs ne peuvent pas modifier ces champs",
        });
      }
    }

    await ctx.db.patch(args.containerId, updates);

    return null;
  },
});

/**
 * Deactivate a container (soft delete)
 * Deactivated containers cannot be used for new bookings
 */
export const deactivate = mutation({
  args: {
    containerId: v.id("containers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const container = await ctx.db.get(args.containerId);
    if (!container) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conteneur introuvable",
      });
    }

    if (!container.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Le conteneur est deja inactif",
      });
    }

    // Check for active bookings
    if (container.bookingId) {
      const booking = await ctx.db.get(container.bookingId);
      if (booking && (booking.status === "pending" || booking.status === "confirmed")) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Impossible de desactiver un conteneur dans une reservation active",
        });
      }
    }

    await ctx.db.patch(args.containerId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reactivate a previously deactivated container
 */
export const reactivate = mutation({
  args: {
    containerId: v.id("containers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const container = await ctx.db.get(args.containerId);
    if (!container) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conteneur introuvable",
      });
    }

    if (container.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Le conteneur est deja actif",
      });
    }

    await ctx.db.patch(args.containerId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Transfer container ownership to a different carrier (port admin only)
 */
export const transfer = mutation({
  args: {
    containerId: v.id("containers"),
    newOwnerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const container = await ctx.db.get(args.containerId);
    if (!container) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conteneur introuvable",
      });
    }

    if (container.ownerId === args.newOwnerId) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Le conteneur appartient deja a ce transporteur",
      });
    }

    // Cannot transfer if in an active booking
    if (container.bookingId) {
      const booking = await ctx.db.get(container.bookingId);
      if (booking && (booking.status === "pending" || booking.status === "confirmed")) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Impossible de transferer un conteneur dans une reservation active",
        });
      }
    }

    await ctx.db.patch(args.containerId, {
      ownerId: args.newOwnerId,
      updatedAt: Date.now(),
    });

    return null;
  },
});
