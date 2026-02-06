/**
 * Time Slot Queries
 * 
 * Updated for new schema:
 * - Time slots are terminal-level (not gate-level)
 * - Uses terminalId instead of gateId
 * - Uses by_terminal_and_date index
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAnyRole } from "../lib/permissions";

/**
 * Get available time slots for a terminal on a specific date
 * Real-time subscription for capacity updates
 */
export const listByTerminalAndDate = query({
  args: {
    terminalId: v.id("terminals"),
    date: v.string(), // YYYY-MM-DD
  },
  returns: v.array(
    v.object({
      _id: v.id("timeSlots"),
      terminalId: v.id("terminals"),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      availableCapacity: v.number(),
      autoValidationThreshold: v.optional(v.number()),
      isAvailable: v.boolean(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.date)
      )
      .collect();

    return slots.map((slot) => ({
      _id: slot._id,
      terminalId: slot.terminalId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      availableCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      autoValidationThreshold: slot.autoValidationThreshold,
      isAvailable: slot.currentBookings < slot.maxCapacity && slot.isActive,
      isActive: slot.isActive,
    }));
  },
});

/**
 * Get all time slots for a terminal (for management)
 */
export const listByTerminal = query({
  args: {
    terminalId: v.id("terminals"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("timeSlots"),
      terminalId: v.id("terminals"),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      autoValidationThreshold: v.optional(v.number()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    let slots;

    if (args.activeOnly) {
      slots = await ctx.db
        .query("timeSlots")
        .withIndex("by_terminal_and_active", (q) =>
          q.eq("terminalId", args.terminalId).eq("isActive", true)
        )
        .collect();
    } else {
      slots = await ctx.db
        .query("timeSlots")
        .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
        .collect();
    }

    // Filter by date range if provided
    if (args.startDate) {
      slots = slots.filter((s) => s.date >= args.startDate!);
    }
    if (args.endDate) {
      slots = slots.filter((s) => s.date <= args.endDate!);
    }

    return slots.map((slot) => ({
      _id: slot._id,
      terminalId: slot.terminalId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      autoValidationThreshold: slot.autoValidationThreshold,
      isActive: slot.isActive,
    }));
  },
});

/**
 * Get a single time slot with full details
 */
export const get = query({
  args: { timeSlotId: v.id("timeSlots") },
  returns: v.union(
    v.object({
      _id: v.id("timeSlots"),
      terminalId: v.id("terminals"),
      terminalName: v.string(),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      availableCapacity: v.number(),
      autoValidationThreshold: v.optional(v.number()),
      isAvailable: v.boolean(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.timeSlotId);
    if (!slot) return null;

    const terminal = await ctx.db.get(slot.terminalId);

    return {
      _id: slot._id,
      terminalId: slot.terminalId,
      terminalName: terminal?.name ?? "Inconnu",
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      availableCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      autoValidationThreshold: slot.autoValidationThreshold,
      isAvailable: slot.currentBookings < slot.maxCapacity && slot.isActive,
      isActive: slot.isActive,
    };
  },
});

/**
 * Get capacity overview for a terminal on a date
 */
export const getTerminalCapacityOverview = query({
  args: {
    terminalId: v.id("terminals"),
    date: v.string(),
  },
  returns: v.object({
    terminal: v.object({
      _id: v.id("terminals"),
      name: v.string(),
    }),
    slots: v.array(
      v.object({
        _id: v.id("timeSlots"),
        startTime: v.string(),
        endTime: v.string(),
        maxCapacity: v.number(),
        currentBookings: v.number(),
        availableCapacity: v.number(),
        utilizationPercent: v.number(),
      })
    ),
    summary: v.object({
      totalCapacity: v.number(),
      totalBooked: v.number(),
      overallUtilization: v.number(),
      slotCount: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new Error("Terminal introuvable");
    }

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.date)
      )
      .collect();

    const activeSlots = slots.filter((s) => s.isActive);

    const slotData = activeSlots.map((slot) => {
      const availableCapacity = Math.max(0, slot.maxCapacity - slot.currentBookings);
      return {
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxCapacity: slot.maxCapacity,
        currentBookings: slot.currentBookings,
        availableCapacity,
        utilizationPercent:
          slot.maxCapacity > 0
            ? Math.round((slot.currentBookings / slot.maxCapacity) * 100)
            : 0,
      };
    });

    const totalCapacity = slotData.reduce((sum, s) => sum + s.maxCapacity, 0);
    const totalBooked = slotData.reduce((sum, s) => sum + s.currentBookings, 0);

    return {
      terminal: { _id: terminal._id, name: terminal.name },
      slots: slotData,
      summary: {
        totalCapacity,
        totalBooked,
        overallUtilization:
          totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
        slotCount: activeSlots.length,
      },
    };
  },
});

/**
 * Get available slots for booking (carrier-facing)
 * Returns only slots with available capacity
 */
export const getAvailableSlots = query({
  args: {
    terminalId: v.id("terminals"),
    date: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("timeSlots"),
      startTime: v.string(),
      endTime: v.string(),
      availableCapacity: v.number(),
      autoValidationThreshold: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.date)
      )
      .collect();

    return slots
      .filter((s) => s.isActive && s.currentBookings < s.maxCapacity)
      .map((slot) => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableCapacity: slot.maxCapacity - slot.currentBookings,
        autoValidationThreshold: slot.autoValidationThreshold,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});
