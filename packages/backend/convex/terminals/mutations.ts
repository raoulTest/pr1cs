/**
 * Terminal Mutations
 *
 * Updated: Terminals now have capacity settings at terminal level
 * SlotTemplates (168 rows) are created automatically when a terminal is created
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, requireRole } from "../lib/permissions";

/**
 * Create a new terminal
 * Also creates 168 slotTemplates (7 days × 24 hours)
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

    // Default values
    const defaultCapacity = args.defaultSlotCapacity ?? 20;
    const opStart = args.operatingHoursStart ?? "00:00";
    const opEnd = args.operatingHoursEnd ?? "23:59";

    const terminalId = await ctx.db.insert("terminals", {
      name: args.name,
      code: args.code,
      address: args.address,
      timezone: args.timezone,
      isActive: true,
      // Terminal-level capacity settings with defaults
      defaultSlotCapacity: defaultCapacity,
      autoValidationThreshold: args.autoValidationThreshold ?? 50,
      capacityAlertThresholds: args.capacityAlertThresholds ?? [70, 85, 95],
      operatingHoursStart: opStart,
      operatingHoursEnd: opEnd,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });

    // Create 168 slotTemplates (7 days × 24 hours)
    const opStartHour = parseInt(opStart.split(":")[0], 10);
    const opEndHour = parseInt(opEnd.split(":")[0], 10);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let hour = 0; hour < 24; hour++) {
        // Determine if this slot is within operating hours
        const isActive = hour >= opStartHour && hour <= opEndHour;

        await ctx.db.insert("slotTemplates", {
          terminalId,
          dayOfWeek,
          hour,
          maxCapacity: defaultCapacity,
          isActive,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return terminalId;
  },
});

/**
 * Update a terminal
 * Note: Capacity settings (defaultSlotCapacity, operatingHours)
 * are IMMUTABLE after creation. Use slotTemplates mutations to modify capacity.
 */
export const update = mutation({
  args: {
    terminalId: v.id("terminals"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    // Only autoValidationThreshold and capacityAlertThresholds can be updated
    autoValidationThreshold: v.optional(v.number()),
    capacityAlertThresholds: v.optional(v.array(v.number())),
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
