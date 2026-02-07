/**
 * Terminal Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireAnyRole,
  getManagedTerminalIds,
  isPortAdmin,
  isCarrier,
} from "../lib/permissions";

/**
 * List terminals based on user role
 * - Port admins see all terminals
 * - Terminal operators see only assigned terminals
 * - Carriers see all active terminals (for booking)
 */
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("terminals"),
      _creationTime: v.number(),
      name: v.string(),
      code: v.string(),
      address: v.optional(v.string()),
      timezone: v.string(),
      isActive: v.boolean(),
      gateCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    let terminals;

    if (isPortAdmin(user)) {
      // Port admins see all terminals
      if (args.activeOnly) {
        terminals = await ctx.db
          .query("terminals")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect();
      } else {
        terminals = await ctx.db.query("terminals").collect();
      }
    } else if (isCarrier(user)) {
      // Carriers see all active terminals (for booking)
      terminals = await ctx.db
        .query("terminals")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    } else {
      // Terminal operators see only assigned terminals
      const managedIds = await getManagedTerminalIds(ctx, user);
      const allTerminals = await Promise.all(
        managedIds.map((id) => ctx.db.get(id))
      );
      terminals = allTerminals.filter(
        (t): t is NonNullable<typeof t> =>
          t !== null && (!args.activeOnly || t.isActive)
      );
    }

    // Add gate counts
    return Promise.all(
      terminals.map(async (t) => {
        const gates = await ctx.db
          .query("gates")
          .withIndex("by_terminal_and_active", (q) =>
            q.eq("terminalId", t._id).eq("isActive", true)
          )
          .collect();

        return {
          _id: t._id,
          _creationTime: t._creationTime,
          name: t.name,
          code: t.code,
          address: t.address,
          timezone: t.timezone,
          isActive: t.isActive,
          gateCount: gates.length,
        };
      })
    );
  },
});

/**
 * Get a single terminal by ID
 */
export const get = query({
  args: { terminalId: v.id("terminals") },
  returns: v.union(
    v.object({
      _id: v.id("terminals"),
      _creationTime: v.number(),
      name: v.string(),
      code: v.string(),
      address: v.optional(v.string()),
      timezone: v.string(),
      isActive: v.boolean(),
      autoValidationThreshold: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      gateCount: v.number(),
      totalCapacity: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) return null;

    const gates = await ctx.db
      .query("gates")
      .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
      .collect();

    // Capacity is now at the terminal level, not gate level
    // Use terminal's defaultSlotCapacity * number of active gates as a rough estimate
    const totalCapacity = terminal.defaultSlotCapacity ?? 10;

    return {
      _id: terminal._id,
      _creationTime: terminal._creationTime,
      name: terminal.name,
      code: terminal.code,
      address: terminal.address,
      timezone: terminal.timezone,
      isActive: terminal.isActive,
      autoValidationThreshold: terminal.autoValidationThreshold,
      createdAt: terminal.createdAt,
      updatedAt: terminal.updatedAt,
      gateCount: gates.length,
      totalCapacity,
    };
  },
});

/**
 * Get terminal by code
 */
export const getByCode = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("terminals"),
      name: v.string(),
      code: v.string(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!terminal) return null;

    return {
      _id: terminal._id,
      name: terminal.name,
      code: terminal.code,
      isActive: terminal.isActive,
    };
  },
});
