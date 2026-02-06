/**
 * Container Queries
 * Read operations for container data with role-based access control
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  isPortAdmin,
  isCarrier,
  canViewContainer,
} from "../lib/permissions";
import {
  containerTypeValidator,
  containerDimensionsValidator,
  containerWeightClassValidator,
  containerOperationValidator,
} from "../lib/validators";
import type { Doc } from "../_generated/dataModel";

// ============================================================================
// RETURN TYPE VALIDATORS
// ============================================================================

const containerListItemValidator = v.object({
  _id: v.id("containers"),
  _creationTime: v.number(),
  containerNumber: v.string(),
  containerType: containerTypeValidator,
  dimensions: containerDimensionsValidator,
  weightClass: containerWeightClassValidator,
  operationType: containerOperationValidator,
  isEmpty: v.boolean(),
  isActive: v.boolean(),
  isBooked: v.boolean(),
  readyDate: v.optional(v.number()),
  departureDate: v.optional(v.number()),
});

const containerDetailValidator = v.object({
  _id: v.id("containers"),
  _creationTime: v.number(),
  containerNumber: v.string(),
  containerType: containerTypeValidator,
  dimensions: containerDimensionsValidator,
  weightClass: containerWeightClassValidator,
  operationType: containerOperationValidator,
  isEmpty: v.boolean(),
  isActive: v.boolean(),
  readyDate: v.optional(v.number()),
  departureDate: v.optional(v.number()),
  notes: v.optional(v.string()),
  // Booking info
  bookingId: v.optional(v.id("bookings")),
  bookingReference: v.optional(v.string()),
  bookingStatus: v.optional(v.string()),
  // Owner info
  ownerId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single container by ID with full details
 */
export const get = query({
  args: { containerId: v.id("containers") },
  returns: v.union(containerDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const container = await ctx.db.get(args.containerId);
    if (!container) return null;

    // Check permission
    const canView = await canViewContainer(ctx, user, args.containerId);
    if (!canView) return null;

    // Fetch booking info if associated
    let bookingReference: string | undefined;
    let bookingStatus: string | undefined;
    if (container.bookingId) {
      const booking = await ctx.db.get(container.bookingId);
      if (booking) {
        bookingReference = booking.bookingReference;
        bookingStatus = booking.status;
      }
    }

    return {
      _id: container._id,
      _creationTime: container._creationTime,
      containerNumber: container.containerNumber,
      containerType: container.containerType,
      dimensions: container.dimensions,
      weightClass: container.weightClass,
      operationType: container.operationType,
      isEmpty: container.isEmpty,
      isActive: container.isActive,
      readyDate: container.readyDate,
      departureDate: container.departureDate,
      notes: container.notes,
      bookingId: container.bookingId,
      bookingReference,
      bookingStatus,
      ownerId: container.ownerId,
      createdAt: container.createdAt,
      updatedAt: container.updatedAt,
    };
  },
});

/**
 * List containers for the current carrier user
 */
export const listMy = query({
  args: {
    operationType: v.optional(containerOperationValidator),
    onlyAvailable: v.optional(v.boolean()), // Not booked
    limit: v.optional(v.number()),
  },
  returns: v.array(containerListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user)) {
      return [];
    }

    const limit = args.limit ?? 100;

    let containersQuery;
    if (args.operationType) {
      containersQuery = ctx.db
        .query("containers")
        .withIndex("by_owner_and_operation", (q) =>
          q.eq("ownerId", user.userId).eq("operationType", args.operationType!)
        );
    } else {
      containersQuery = ctx.db
        .query("containers")
        .withIndex("by_owner_and_active", (q) =>
          q.eq("ownerId", user.userId).eq("isActive", true)
        );
    }

    let containers = await containersQuery.take(limit * 2);

    // Filter to only active
    containers = containers.filter((c) => c.isActive);

    // Filter to available only if requested
    if (args.onlyAvailable) {
      containers = containers.filter((c) => !c.bookingId);
    }

    return containers.slice(0, limit).map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      containerNumber: c.containerNumber,
      containerType: c.containerType,
      dimensions: c.dimensions,
      weightClass: c.weightClass,
      operationType: c.operationType,
      isEmpty: c.isEmpty,
      isActive: c.isActive,
      isBooked: !!c.bookingId,
      readyDate: c.readyDate,
      departureDate: c.departureDate,
    }));
  },
});

/**
 * List available containers for booking
 * Only returns containers owned by the current carrier that are not already booked
 */
export const listAvailable = query({
  args: {
    operationType: v.optional(containerOperationValidator),
  },
  returns: v.array(containerListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user)) {
      return [];
    }

    let containersQuery;
    if (args.operationType) {
      containersQuery = ctx.db
        .query("containers")
        .withIndex("by_owner_and_operation", (q) =>
          q.eq("ownerId", user.userId).eq("operationType", args.operationType!)
        );
    } else {
      containersQuery = ctx.db
        .query("containers")
        .withIndex("by_owner_and_active", (q) =>
          q.eq("ownerId", user.userId).eq("isActive", true)
        );
    }

    const containers = await containersQuery.collect();

    // Filter to active and not booked
    return containers
      .filter((c) => c.isActive && !c.bookingId)
      .map((c) => ({
        _id: c._id,
        _creationTime: c._creationTime,
        containerNumber: c.containerNumber,
        containerType: c.containerType,
        dimensions: c.dimensions,
        weightClass: c.weightClass,
        operationType: c.operationType,
        isEmpty: c.isEmpty,
        isActive: c.isActive,
        isBooked: false,
        readyDate: c.readyDate,
        departureDate: c.departureDate,
      }));
  },
});

/**
 * List all containers (port admin only)
 */
export const listAll = query({
  args: {
    ownerId: v.optional(v.string()),
    operationType: v.optional(containerOperationValidator),
    containerType: v.optional(containerTypeValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(containerListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user)) {
      return [];
    }

    const limit = args.limit ?? 100;

    let containers: Doc<"containers">[];

    if (args.ownerId) {
      containers = await ctx.db
        .query("containers")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId!))
        .take(limit);
    } else if (args.operationType) {
      containers = await ctx.db
        .query("containers")
        .withIndex("by_operation", (q) =>
          q.eq("operationType", args.operationType!)
        )
        .take(limit);
    } else if (args.containerType) {
      containers = await ctx.db
        .query("containers")
        .withIndex("by_type", (q) => q.eq("containerType", args.containerType!))
        .take(limit);
    } else {
      containers = await ctx.db.query("containers").take(limit);
    }

    return containers.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      containerNumber: c.containerNumber,
      containerType: c.containerType,
      dimensions: c.dimensions,
      weightClass: c.weightClass,
      operationType: c.operationType,
      isEmpty: c.isEmpty,
      isActive: c.isActive,
      isBooked: !!c.bookingId,
      readyDate: c.readyDate,
      departureDate: c.departureDate,
    }));
  },
});

/**
 * Get containers by booking ID
 */
export const getByBooking = query({
  args: { bookingId: v.id("bookings") },
  returns: v.array(containerListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get booking to check access
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return [];

    // Check permission
    const isOwner = booking.carrierId === user.userId;
    if (!isOwner && !isPortAdmin(user)) {
      return [];
    }

    const containers = await ctx.db
      .query("containers")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    return containers.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      containerNumber: c.containerNumber,
      containerType: c.containerType,
      dimensions: c.dimensions,
      weightClass: c.weightClass,
      operationType: c.operationType,
      isEmpty: c.isEmpty,
      isActive: c.isActive,
      isBooked: true,
      readyDate: c.readyDate,
      departureDate: c.departureDate,
    }));
  },
});

/**
 * Count containers by operation type for the current carrier
 */
export const countByOperation = query({
  args: {},
  returns: v.object({
    pickUp: v.object({ total: v.number(), available: v.number() }),
    dropOff: v.object({ total: v.number(), available: v.number() }),
  }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user)) {
      return {
        pickUp: { total: 0, available: 0 },
        dropOff: { total: 0, available: 0 },
      };
    }

    const containers = await ctx.db
      .query("containers")
      .withIndex("by_owner", (q) => q.eq("ownerId", user.userId))
      .collect();

    const activeContainers = containers.filter((c) => c.isActive);

    const pickUpContainers = activeContainers.filter(
      (c) => c.operationType === "pick_up"
    );
    const dropOffContainers = activeContainers.filter(
      (c) => c.operationType === "drop_off"
    );

    return {
      pickUp: {
        total: pickUpContainers.length,
        available: pickUpContainers.filter((c) => !c.bookingId).length,
      },
      dropOff: {
        total: dropOffContainers.length,
        available: dropOffContainers.filter((c) => !c.bookingId).length,
      },
    };
  },
});
