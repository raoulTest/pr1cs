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
 * Note: Capacity is now at terminal level, gates are just entry points
 */
export const create = mutation({
  args: {
    terminalId: v.id("terminals"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
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
        message: "Terminal introuvable",
      });
    }
    if (!terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Impossible d'ajouter des portes à un terminal inactif",
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
        message: `Une porte avec le code ${args.code} existe déjà`,
      });
    }

    const now = Date.now();
    return await ctx.db.insert("gates", {
      terminalId: args.terminalId,
      name: args.name,
      code: args.code,
      description: args.description,
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
 * Note: Capacity is now at terminal level, not gate level
 */
export const update = mutation({
  args: {
    gateId: v.id("gates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
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
        message: "Porte introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

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
        message: "Porte introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Check for pending or confirmed bookings at this gate
    const activeBooking = await ctx.db
      .query("bookings")
      .withIndex("by_gate", (q) => q.eq("gateId", args.gateId))
      .first();

    if (activeBooking && (activeBooking.status === "pending" || activeBooking.status === "confirmed")) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible de désactiver une porte avec des réservations en cours. Veuillez d'abord annuler ou réaffecter les réservations.",
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
        message: "Porte introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Verify terminal is active
    const terminal = await ctx.db.get(gate.terminalId);
    if (!terminal?.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Impossible de réactiver une porte sur un terminal inactif",
      });
    }

    await ctx.db.patch(args.gateId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});
