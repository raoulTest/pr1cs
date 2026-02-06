/**
 * Terminal Mutations
 * 
 * Updated: Terminals now have capacity settings at terminal level
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
    // Terminal-level capacity settings
    defaultSlotCapacity: v.optional(v.number()),
    autoValidationThreshold: v.optional(v.number()),
    capacityAlertThresholds: v.optional(v.array(v.number())),
    operatingHoursStart: v.optional(v.string()),
    operatingHoursEnd: v.optional(v.string()),
    slotDurationMinutes: v.optional(v.number()),
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
        message: `Un terminal avec le code ${args.code} existe déjà`,
      });
    }

    const now = Date.now();
    return await ctx.db.insert("terminals", {
      name: args.name,
      code: args.code,
      address: args.address,
      timezone: args.timezone,
      isActive: true,
      // Terminal-level capacity settings with defaults
      defaultSlotCapacity: args.defaultSlotCapacity ?? 20,
      autoValidationThreshold: args.autoValidationThreshold ?? 50,
      capacityAlertThresholds: args.capacityAlertThresholds ?? [70, 85, 95],
      operatingHoursStart: args.operatingHoursStart ?? "06:00",
      operatingHoursEnd: args.operatingHoursEnd ?? "22:00",
      slotDurationMinutes: args.slotDurationMinutes ?? 60,
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
    // Terminal-level capacity settings
    defaultSlotCapacity: v.optional(v.number()),
    autoValidationThreshold: v.optional(v.number()),
    capacityAlertThresholds: v.optional(v.array(v.number())),
    operatingHoursStart: v.optional(v.string()),
    operatingHoursEnd: v.optional(v.string()),
    slotDurationMinutes: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal introuvable",
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
        message: "Terminal introuvable",
      });
    }

    // Check for active bookings
    const activeBooking = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_status", (q) =>
        q.eq("terminalId", args.terminalId).eq("status", "pending")
      )
      .first();

    if (activeBooking) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible de désactiver un terminal avec des réservations en attente. Veuillez d'abord annuler ou compléter les réservations.",
      });
    }

    // Also check for confirmed bookings
    const confirmedBooking = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_status", (q) =>
        q.eq("terminalId", args.terminalId).eq("status", "confirmed")
      )
      .first();

    if (confirmedBooking) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible de désactiver un terminal avec des réservations confirmées. Veuillez d'abord annuler ou consommer les réservations.",
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
