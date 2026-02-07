/**
 * SlotTemplates Queries
 *
 * Queries for viewing weekly recurring slot templates.
 * Templates are created automatically when a terminal is created (168 rows = 7 days × 24 hours).
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireTerminalAccess,
} from "../lib/permissions";

/**
 * Get all templates for a terminal (168 rows)
 */
export const listByTerminal = query({
  args: { terminalId: v.id("terminals") },
  returns: v.array(
    v.object({
      _id: v.id("slotTemplates"),
      dayOfWeek: v.number(),
      hour: v.number(),
      maxCapacity: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireTerminalAccess(ctx, user, args.terminalId);

    const templates = await ctx.db
      .query("slotTemplates")
      .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
      .collect();

    return templates
      .map((t) => ({
        _id: t._id,
        dayOfWeek: t.dayOfWeek,
        hour: t.hour,
        maxCapacity: t.maxCapacity,
        isActive: t.isActive,
      }))
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.hour - b.hour;
      });
  },
});

/**
 * Get templates for a specific day of week (24 rows)
 */
export const listByDay = query({
  args: {
    terminalId: v.id("terminals"),
    dayOfWeek: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("slotTemplates"),
      hour: v.number(),
      maxCapacity: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireTerminalAccess(ctx, user, args.terminalId);

    const templates = await ctx.db
      .query("slotTemplates")
      .withIndex("by_terminal_and_day", (q) =>
        q.eq("terminalId", args.terminalId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    return templates
      .map((t) => ({
        _id: t._id,
        hour: t.hour,
        maxCapacity: t.maxCapacity,
        isActive: t.isActive,
      }))
      .sort((a, b) => a.hour - b.hour);
  },
});

/**
 * Get a single template by terminal, day, and hour
 */
export const getByDayAndHour = query({
  args: {
    terminalId: v.id("terminals"),
    dayOfWeek: v.number(),
    hour: v.number(),
  },
  returns: v.union(
    v.object({
      _id: v.id("slotTemplates"),
      dayOfWeek: v.number(),
      hour: v.number(),
      maxCapacity: v.number(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireTerminalAccess(ctx, user, args.terminalId);

    const template = await ctx.db
      .query("slotTemplates")
      .withIndex("by_terminal_day_hour", (q) =>
        q
          .eq("terminalId", args.terminalId)
          .eq("dayOfWeek", args.dayOfWeek)
          .eq("hour", args.hour)
      )
      .first();

    if (!template) return null;

    return {
      _id: template._id,
      dayOfWeek: template.dayOfWeek,
      hour: template.hour,
      maxCapacity: template.maxCapacity,
      isActive: template.isActive,
    };
  },
});
