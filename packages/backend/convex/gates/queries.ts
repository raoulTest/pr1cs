/**
 * Gate Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireAnyRole,
  canManageTerminal,
} from "../lib/permissions";
import { truckTypeValidator, truckClassValidator } from "../lib/validators";

/**
 * List gates for a terminal
 */
export const listByTerminal = query({
  args: {
    terminalId: v.id("terminals"),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("gates"),
      _creationTime: v.number(),
      terminalId: v.id("terminals"),
      name: v.string(),
      code: v.string(),
      description: v.optional(v.string()),
      isActive: v.boolean(),
      defaultCapacity: v.number(),
      allowedTruckTypes: v.array(truckTypeValidator),
      allowedTruckClasses: v.array(truckClassValidator),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    let gates;

    if (args.activeOnly) {
      gates = await ctx.db
        .query("gates")
        .withIndex("by_terminal_and_active", (q) =>
          q.eq("terminalId", args.terminalId).eq("isActive", true)
        )
        .collect();
    } else {
      gates = await ctx.db
        .query("gates")
        .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
        .collect();
    }

    return gates.map((g) => ({
      _id: g._id,
      _creationTime: g._creationTime,
      terminalId: g.terminalId,
      name: g.name,
      code: g.code,
      description: g.description,
      isActive: g.isActive,
      defaultCapacity: g.defaultCapacity,
      allowedTruckTypes: g.allowedTruckTypes,
      allowedTruckClasses: g.allowedTruckClasses,
    }));
  },
});

/**
 * Get a single gate
 */
export const get = query({
  args: { gateId: v.id("gates") },
  returns: v.union(
    v.object({
      _id: v.id("gates"),
      _creationTime: v.number(),
      terminalId: v.id("terminals"),
      terminalName: v.string(),
      name: v.string(),
      code: v.string(),
      description: v.optional(v.string()),
      isActive: v.boolean(),
      defaultCapacity: v.number(),
      allowedTruckTypes: v.array(truckTypeValidator),
      allowedTruckClasses: v.array(truckClassValidator),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const gate = await ctx.db.get(args.gateId);
    if (!gate) return null;

    const terminal = await ctx.db.get(gate.terminalId);

    return {
      _id: gate._id,
      _creationTime: gate._creationTime,
      terminalId: gate.terminalId,
      terminalName: terminal?.name ?? "Unknown",
      name: gate.name,
      code: gate.code,
      description: gate.description,
      isActive: gate.isActive,
      defaultCapacity: gate.defaultCapacity,
      allowedTruckTypes: gate.allowedTruckTypes,
      allowedTruckClasses: gate.allowedTruckClasses,
      createdAt: gate.createdAt,
      updatedAt: gate.updatedAt,
    };
  },
});

/**
 * Get gate by code
 */
export const getByCode = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("gates"),
      name: v.string(),
      code: v.string(),
      terminalId: v.id("terminals"),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const gate = await ctx.db
      .query("gates")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!gate) return null;

    return {
      _id: gate._id,
      name: gate.name,
      code: gate.code,
      terminalId: gate.terminalId,
      isActive: gate.isActive,
    };
  },
});

/**
 * Check if a truck type/class is allowed at a gate
 */
export const isTruckAllowed = query({
  args: {
    gateId: v.id("gates"),
    truckType: truckTypeValidator,
    truckClass: truckClassValidator,
  },
  returns: v.object({
    allowed: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const gate = await ctx.db.get(args.gateId);
    if (!gate) {
      return { allowed: false, reason: "Gate not found" };
    }

    if (!gate.isActive) {
      return { allowed: false, reason: "Gate is not active" };
    }

    if (!gate.allowedTruckTypes.includes(args.truckType)) {
      return {
        allowed: false,
        reason: `Gate does not accept ${args.truckType} trucks`,
      };
    }

    if (!gate.allowedTruckClasses.includes(args.truckClass)) {
      return {
        allowed: false,
        reason: `Gate does not accept ${args.truckClass} class trucks`,
      };
    }

    return { allowed: true };
  },
});
