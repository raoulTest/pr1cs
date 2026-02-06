/**
 * Time Slot Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  requireTerminalAccess,
} from "../lib/permissions";

/**
 * Helper to check if two time ranges overlap
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert HH:mm to minutes for comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Check for overlap (not touching)
  return s1 < e2 && s2 < e1;
}

/**
 * Validate time format (HH:mm)
 */
function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * Create a new time slot
 */
export const create = mutation({
  args: {
    gateId: v.id("gates"),
    date: v.string(), // YYYY-MM-DD
    startTime: v.string(), // HH:mm
    endTime: v.string(), // HH:mm
    maxCapacity: v.number(),
  },
  returns: v.id("timeSlots"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    // Validate time format
    if (!isValidTimeFormat(args.startTime) || !isValidTimeFormat(args.endTime)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Time must be in HH:mm format (24-hour)",
      });
    }

    // Validate end time is after start time
    if (args.startTime >= args.endTime) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "End time must be after start time",
      });
    }

    // Get gate and verify access
    const gate = await ctx.db.get(args.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    if (!gate.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot create time slots for inactive gate",
      });
    }

    // Validate capacity
    if (args.maxCapacity < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Max capacity must be at least 1",
      });
    }

    // Check for overlapping slots on the same gate and date
    const existingSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_gate_and_date", (q) =>
        q.eq("gateId", args.gateId).eq("date", args.date)
      )
      .collect();

    for (const existing of existingSlots) {
      if (
        existing.isActive &&
        timesOverlap(
          args.startTime,
          args.endTime,
          existing.startTime,
          existing.endTime
        )
      ) {
        throw new ConvexError({
          code: "OVERLAP",
          message: `Time slot overlaps with existing slot ${existing.startTime}-${existing.endTime}`,
        });
      }
    }

    const now = Date.now();
    return await ctx.db.insert("timeSlots", {
      gateId: args.gateId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      maxCapacity: args.maxCapacity,
      currentBookings: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });
  },
});

/**
 * Bulk create time slots for a date range
 */
export const bulkCreate = mutation({
  args: {
    gateId: v.id("gates"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
    slots: v.array(
      v.object({
        startTime: v.string(),
        endTime: v.string(),
        maxCapacity: v.number(),
      })
    ),
    skipExisting: v.optional(v.boolean()), // Skip dates that already have slots
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
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

    if (!gate.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cannot create time slots for inactive gate",
      });
    }

    // Validate slot templates
    for (const slot of args.slots) {
      if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Time must be in HH:mm format (24-hour)",
        });
      }
      if (slot.startTime >= slot.endTime) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "End time must be after start time",
        });
      }
      if (slot.maxCapacity < 1) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Max capacity must be at least 1",
        });
      }
    }

    // Check for overlapping templates
    for (let i = 0; i < args.slots.length; i++) {
      for (let j = i + 1; j < args.slots.length; j++) {
        if (
          timesOverlap(
            args.slots[i].startTime,
            args.slots[i].endTime,
            args.slots[j].startTime,
            args.slots[j].endTime
          )
        ) {
          throw new ConvexError({
            code: "OVERLAP",
            message: "Slot templates overlap with each other",
          });
        }
      }
    }

    // Generate dates in range
    const dates: string[] = [];
    const current = new Date(args.startDate);
    const end = new Date(args.endDate);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const now = Date.now();
    let created = 0;
    let skipped = 0;

    for (const date of dates) {
      // Check if date already has slots
      if (args.skipExisting) {
        const existingSlots = await ctx.db
          .query("timeSlots")
          .withIndex("by_gate_and_date", (q) =>
            q.eq("gateId", args.gateId).eq("date", date)
          )
          .first();

        if (existingSlots) {
          skipped += args.slots.length;
          continue;
        }
      }

      // Create slots for this date
      for (const slotTemplate of args.slots) {
        await ctx.db.insert("timeSlots", {
          gateId: args.gateId,
          date,
          startTime: slotTemplate.startTime,
          endTime: slotTemplate.endTime,
          maxCapacity: slotTemplate.maxCapacity,
          currentBookings: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdBy: user.userId,
        });
        created++;
      }
    }

    return { created, skipped };
  },
});

/**
 * Update a time slot
 */
export const update = mutation({
  args: {
    timeSlotId: v.id("timeSlots"),
    maxCapacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const slot = await ctx.db.get(args.timeSlotId);
    if (!slot) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Time slot not found",
      });
    }

    const gate = await ctx.db.get(slot.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Validate capacity if changing
    if (args.maxCapacity !== undefined) {
      if (args.maxCapacity < 1) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Max capacity must be at least 1",
        });
      }
      // Can't reduce capacity below current bookings
      if (args.maxCapacity < slot.currentBookings) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: `Cannot reduce capacity below current bookings (${slot.currentBookings})`,
        });
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.maxCapacity !== undefined) {
      updates.maxCapacity = args.maxCapacity;
    }
    if (args.isActive !== undefined) {
      // Can't deactivate slot with bookings
      if (!args.isActive && slot.currentBookings > 0) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Cannot deactivate time slot with active bookings",
        });
      }
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.timeSlotId, updates);
    return null;
  },
});

/**
 * Delete a time slot (only if no bookings)
 */
export const remove = mutation({
  args: { timeSlotId: v.id("timeSlots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const slot = await ctx.db.get(args.timeSlotId);
    if (!slot) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Time slot not found",
      });
    }

    const gate = await ctx.db.get(slot.gateId);
    if (!gate) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gate not found",
      });
    }

    await requireTerminalAccess(ctx, user, gate.terminalId);

    // Check for any bookings (even cancelled)
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .first();

    if (booking) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Cannot delete time slot with bookings. Deactivate it instead.",
      });
    }

    await ctx.db.delete(args.timeSlotId);
    return null;
  },
});
