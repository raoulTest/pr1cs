/**
 * Gate Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  requireTerminalAccess,
} from "../lib/permissions";
import { truckTypeValidator, truckClassValidator } from "../lib/validators";

/**
 * Create a new gate
 */
export const create = mutation({
  args: {
    terminalId: v.id("terminals"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    defaultCapacity: v.number(),
    allowedTruckTypes: v.array(truckTypeValidator),
    allowedTruckClasses: v.array(truckClassValidator),
  },
  returns: v.id("gates"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);
    await requireTerminalAccess(ctx, user, args.terminalId);

    // Verify terminal exists and is active
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal not found",
      });
    }
    if (!terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot add gates to inactive terminal",
      });
    }

    // Check code uniqueness
    const existing = await ctx.db
      .query("gates")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: `Gate with code ${args.code} already exists`,
      });
    }

    // Validate capacity
    if (args.defaultCapacity < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Default capacity must be at least 1",
      });
    }

    const now = Date.now();
    return await ctx.db.insert("gates", {
      terminalId: args.terminalId,
      name: args.name,
      code: args.code,
      description: args.description,
      defaultCapacity: args.defaultCapacity,
      allowedTruckTypes: args.allowedTruckTypes,
      allowedTruckClasses: args.allowedTruckClasses,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });
  },
});

/**
 * Update a gate
 */
export const update = mutation({
  args: {
    gateId: v.id("gates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    defaultCapacity: v.optional(v.number()),
    allowedTruckTypes: v.optional(v.array(truckTypeValidator)),
    allowedTruckClasses: v.optional(v.array(truckClassValidator)),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const gate = await ctx.db.get(args.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Validate capacity if provided
    if (args.defaultCapacity !== undefined && args.defaultCapacity < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Default capacity must be at least 1",
      });
    }

    const { gateId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(gateId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Deactivate a gate
 */
export const deactivate = mutation({
  args: { gateId: v.id("gates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const gate = await ctx.db.get(args.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Check for pending bookings at this gate
    const pendingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_gate_and_status", (q) =>
        q.eq("gateId", args.gateId).eq("status", "pending")
      )
      .first();

    if (pendingBooking) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Cannot deactivate gate with pending bookings. Please cancel or reassign pending bookings first.",
      });
    }

    await ctx.db.patch(args.gateId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reactivate a gate
 */
export const reactivate = mutation({
  args: { gateId: v.id("gates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const gate = await ctx.db.get(args.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Verify terminal is active
    const terminal = await ctx.db.get(gate.terminalId);
    if (!terminal?.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot reactivate gate on inactive terminal",
      });
    }

    await ctx.db.patch(args.gateId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});
