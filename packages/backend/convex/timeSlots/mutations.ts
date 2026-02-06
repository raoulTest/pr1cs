/**
 * Time Slot Mutations
 * 
 * Updated for new schema:
 * - Time slots are terminal-level (not gate-level)
 * - Uses terminalId instead of gateId
 * - Uses by_terminal_and_date index
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
    const parts = time.split(":");
    const h = parseInt(parts[0] ?? "0", 10);
    const m = parseInt(parts[1] ?? "0", 10);
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
 * Create a new time slot (terminal-level)
 */
export const create = mutation({
  args: {
    terminalId: v.id("terminals"),
    date: v.string(), // YYYY-MM-DD
    startTime: v.string(), // HH:mm
    endTime: v.string(), // HH:mm
    maxCapacity: v.number(),
    autoValidationThreshold: v.optional(v.number()), // 0-100, percentage for auto-validation
  },
  returns: v.id("timeSlots"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    // Validate time format
    if (!isValidTimeFormat(args.startTime) || !isValidTimeFormat(args.endTime)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Le format de l'heure doit etre HH:mm (24 heures)",
      });
    }

    // Validate end time is after start time
    if (args.startTime >= args.endTime) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "L'heure de fin doit etre apres l'heure de debut",
      });
    }

    // Get terminal and verify access
    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, args.terminalId);

    if (!terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Impossible de creer des creneaux pour un terminal inactif",
      });
    }

    // Validate capacity
    if (args.maxCapacity < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "La capacite maximale doit etre d'au moins 1",
      });
    }

    // Validate auto-validation threshold if provided
    if (args.autoValidationThreshold !== undefined) {
      if (args.autoValidationThreshold < 0 || args.autoValidationThreshold > 100) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Le seuil de validation automatique doit etre entre 0 et 100",
        });
      }
    }

    // Check for overlapping slots on the same terminal and date
    const existingSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", args.terminalId).eq("date", args.date)
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
          message: `Le creneau chevauche un creneau existant ${existing.startTime}-${existing.endTime}`,
        });
      }
    }

    const now = Date.now();
    return await ctx.db.insert("timeSlots", {
      terminalId: args.terminalId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      maxCapacity: args.maxCapacity,
      currentBookings: 0,
      autoValidationThreshold: args.autoValidationThreshold,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });
  },
});

/**
 * Bulk create time slots for a date range (terminal-level)
 */
export const bulkCreate = mutation({
  args: {
    terminalId: v.id("terminals"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
    slots: v.array(
      v.object({
        startTime: v.string(),
        endTime: v.string(),
        maxCapacity: v.number(),
      })
    ),
    autoValidationThreshold: v.optional(v.number()), // Applied to all slots
    skipExisting: v.optional(v.boolean()), // Skip dates that already have slots
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const terminal = await ctx.db.get(args.terminalId);
    if (!terminal) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Terminal introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, args.terminalId);

    if (!terminal.isActive) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Impossible de creer des creneaux pour un terminal inactif",
      });
    }

    // Validate slot templates
    for (const slot of args.slots) {
      if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Le format de l'heure doit etre HH:mm (24 heures)",
        });
      }
      if (slot.startTime >= slot.endTime) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "L'heure de fin doit etre apres l'heure de debut",
        });
      }
      if (slot.maxCapacity < 1) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "La capacite maximale doit etre d'au moins 1",
        });
      }
    }

    // Check for overlapping templates
    for (let i = 0; i < args.slots.length; i++) {
      for (let j = i + 1; j < args.slots.length; j++) {
        const slotI = args.slots[i];
        const slotJ = args.slots[j];
        if (
          slotI &&
          slotJ &&
          timesOverlap(
            slotI.startTime,
            slotI.endTime,
            slotJ.startTime,
            slotJ.endTime
          )
        ) {
          throw new ConvexError({
            code: "OVERLAP",
            message: "Les modeles de creneaux se chevauchent",
          });
        }
      }
    }

    // Generate dates in range
    const dates: string[] = [];
    const current = new Date(args.startDate);
    const end = new Date(args.endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      if (dateStr) {
        dates.push(dateStr);
      }
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
          .withIndex("by_terminal_and_date", (q) =>
            q.eq("terminalId", args.terminalId).eq("date", date)
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
          terminalId: args.terminalId,
          date,
          startTime: slotTemplate.startTime,
          endTime: slotTemplate.endTime,
          maxCapacity: slotTemplate.maxCapacity,
          currentBookings: 0,
          autoValidationThreshold: args.autoValidationThreshold,
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
    autoValidationThreshold: v.optional(v.number()),
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
        message: "Creneau introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, slot.terminalId);

    // Validate capacity if changing
    if (args.maxCapacity !== undefined) {
      if (args.maxCapacity < 1) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "La capacite maximale doit etre d'au moins 1",
        });
      }
      // Can't reduce capacity below current bookings
      if (args.maxCapacity < slot.currentBookings) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: `Impossible de reduire la capacite en dessous des reservations actuelles (${slot.currentBookings})`,
        });
      }
    }

    // Validate auto-validation threshold if provided
    if (args.autoValidationThreshold !== undefined) {
      if (args.autoValidationThreshold < 0 || args.autoValidationThreshold > 100) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Le seuil de validation automatique doit etre entre 0 et 100",
        });
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.maxCapacity !== undefined) {
      updates.maxCapacity = args.maxCapacity;
    }
    if (args.autoValidationThreshold !== undefined) {
      updates.autoValidationThreshold = args.autoValidationThreshold;
    }
    if (args.isActive !== undefined) {
      // Can't deactivate slot with bookings
      if (!args.isActive && slot.currentBookings > 0) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Impossible de desactiver un creneau avec des reservations actives",
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
        message: "Creneau introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, slot.terminalId);

    // Check if there are any bookings for this terminal on this date/time
    // Since bookings use preferredDate/preferredTimeStart/preferredTimeEnd now,
    // we need to check if any bookings overlap with this slot
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", slot.terminalId).eq("preferredDate", slot.date)
      )
      .collect();

    // Check for overlapping bookings
    const overlappingBooking = bookings.find(
      (b) =>
        b.status !== "cancelled" &&
        timesOverlap(
          slot.startTime,
          slot.endTime,
          b.preferredTimeStart,
          b.preferredTimeEnd
        )
    );

    if (overlappingBooking) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible de supprimer un creneau avec des reservations. Desactivez-le a la place.",
      });
    }

    await ctx.db.delete(args.timeSlotId);
    return null;
  },
});
