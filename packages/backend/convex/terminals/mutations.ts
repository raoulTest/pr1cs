/**
 * Terminal Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, requireRole } from "../lib/permissions";

/**
 * Create a new terminal
 */
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    address: v.optional(v.string()),
    timezone: v.string(),
  },
  returns: v.id("terminals"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Check code uniqueness
    const existing = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: `Terminal with code ${args.code} already exists`,
      });
    }

    const now = Date.now();
    return await ctx.db.insert("terminals", {
      name: args.name,
      code: args.code,
      address: args.address,
      timezone: args.timezone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });
  },
});

/**
 * Update a terminal
 */
export const update = mutation({
  args: {
    terminalId: v.id("terminals"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal not found",
      });
    }

    const { terminalId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(terminalId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Deactivate a terminal
 */
export const deactivate = mutation({
  args: { terminalId: v.id("terminals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal not found",
      });
    }

    // Check for active bookings
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_status", (q) =>
        q.eq("terminalId", args.terminalId).eq("status", "pending")
      )
      .first();

    if (activeBookings) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Cannot deactivate terminal with pending bookings. Please cancel or complete pending bookings first.",
      });
    }

    await ctx.db.patch(args.terminalId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reactivate a terminal
 */
export const reactivate = mutation({
  args: { terminalId: v.id("terminals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    await ctx.db.patch(args.terminalId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});
