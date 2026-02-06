/**
 * Time Slot Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAnyRole } from "../lib/permissions";
import { getAvailableCapacity } from "../lib/capacity";

/**
 * Get available time slots for a gate on a specific date
 * Real-time subscription for capacity updates
 */
export const listByGateAndDate = query({
  args: {
    gateId: v.id("gates"),
    date: v.string(), // YYYY-MM-DD
  },
  returns: v.array(
    v.object({
      _id: v.id("timeSlots"),
      gateId: v.id("gates"),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      availableCapacity: v.number(),
      isAvailable: v.boolean(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_gate_and_date", (q) =>
        q.eq("gateId", args.gateId).eq("date", args.date)
      )
      .collect();

    return slots.map((slot) => ({
      _id: slot._id,
      gateId: slot.gateId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      availableCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      isAvailable: slot.currentBookings < slot.maxCapacity && slot.isActive,
      isActive: slot.isActive,
    }));
  },
});

/**
 * Get all time slots for a gate (for management)
 */
export const listByGate = query({
  args: {
    gateId: v.id("gates"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("timeSlots"),
      gateId: v.id("gates"),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireAnyRole(user);

    let slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_gate", (q) => q.eq("gateId", args.gateId))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      slots = slots.filter((s) => s.date >= args.startDate!);
    }
    if (args.endDate) {
      slots = slots.filter((s) => s.date <= args.endDate!);
    }

    return slots.map((slot) => ({
      _id: slot._id,
      gateId: slot.gateId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
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
      gateId: v.id("gates"),
      gateName: v.string(),
      terminalId: v.id("terminals"),
      terminalName: v.string(),
      date: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      maxCapacity: v.number(),
      currentBookings: v.number(),
      availableCapacity: v.number(),
      isAvailable: v.boolean(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.timeSlotId);
    if (!slot) return null;

    const gate = await ctx.db.get(slot.gateId);
    const terminal = gate ? await ctx.db.get(gate.terminalId) : null;

    return {
      _id: slot._id,
      gateId: slot.gateId,
      gateName: gate?.name ?? "Unknown",
      terminalId: gate?.terminalId ?? ("" as any),
      terminalName: terminal?.name ?? "Unknown",
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      availableCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
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
    gates: v.array(
      v.object({
        _id: v.id("gates"),
        name: v.string(),
        totalCapacity: v.number(),
        totalBooked: v.number(),
        utilizationPercent: v.number(),
        slotCount: v.number(),
      })
    ),
    summary: v.object({
      totalCapacity: v.number(),
      totalBooked: v.number(),
      overallUtilization: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new Error("Terminal not found");
    }

    const gates = await ctx.db
      .query("gates")
      .withIndex("by_terminal_and_active", (q) =>
        q.eq("terminalId", args.terminalId).eq("isActive", true)
      )
      .collect();

    const gateData = await Promise.all(
      gates.map(async (gate) => {
        const slots = await ctx.db
          .query("timeSlots")
          .withIndex("by_gate_and_date", (q) =>
            q.eq("gateId", gate._id).eq("date", args.date)
          )
          .collect();

        const activeSlots = slots.filter((s) => s.isActive);
        const totalCapacity = activeSlots.reduce(
          (sum, s) => sum + s.maxCapacity,
          0
        );
        const totalBooked = activeSlots.reduce(
          (sum, s) => sum + s.currentBookings,
          0
        );

        return {
          _id: gate._id,
          name: gate.name,
          totalCapacity,
          totalBooked,
          utilizationPercent:
            totalCapacity > 0
              ? Math.round((totalBooked / totalCapacity) * 100)
              : 0,
          slotCount: activeSlots.length,
        };
      })
    );

    const summary = {
      totalCapacity: gateData.reduce((sum, g) => sum + g.totalCapacity, 0),
      totalBooked: gateData.reduce((sum, g) => sum + g.totalBooked, 0),
      overallUtilization: 0,
    };
    summary.overallUtilization =
      summary.totalCapacity > 0
        ? Math.round((summary.totalBooked / summary.totalCapacity) * 100)
        : 0;

    return {
      terminal: { _id: terminal._id, name: terminal.name },
      gates: gateData,
      summary,
    };
  },
});
