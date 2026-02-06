/**
 * Terminal-Level Capacity Management
 * Handles atomic capacity reservation at the terminal level (not gate)
 * 
 * Key changes from gate-level:
 * - Capacity is defined per terminal, not per gate
 * - Gates are assigned at confirmation time, not booking time
 * - Slots are created on-demand when first booking is made
 */
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

export interface CapacityResult {
  available: number;
  total: number;
  booked: number;
  utilizationPercent: number;
}

export interface SlotCapacity extends CapacityResult {
  slotId?: Id<"timeSlots">; // undefined for virtual slots
  date: string;
  startTime: string;
  endTime: string;
  autoValidationThreshold: number;
  autoValidatedCount: number;
  remainingAutoValidation: number;
  isVirtual: boolean; // true if no slot record exists yet
  isActive: boolean; // false if slot was disabled by operator
}

/**
 * Get slot for terminal and time
 */
export async function getSlotForTerminal(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<Doc<"timeSlots"> | null> {
  return await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .filter((q) => q.eq(q.field("startTime"), startTime))
    .first();
}

/**
 * Check if a terminal slot has capacity and atomically reserve if available.
 * Creates slot on-demand if it doesn't exist.
 */
export async function checkAndReserveCapacity(
  ctx: MutationCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ success: boolean; slotId?: Id<"timeSlots">; error?: string }> {
  // Find or create the slot
  let slot = await getSlotForTerminal(ctx, terminalId, date, startTime);

  if (!slot) {
    // Create slot on-demand with terminal defaults
    const terminal = await ctx.db.get(terminalId);
    if (!terminal) {
      return { success: false, error: "Terminal introuvable" };
    }

    const now = Date.now();
    const slotId = await ctx.db.insert("timeSlots", {
      terminalId,
      date,
      startTime,
      endTime,
      maxCapacity: terminal.defaultSlotCapacity,
      currentBookings: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    });

    slot = await ctx.db.get(slotId);
  }

  if (!slot || !slot.isActive) {
    return { success: false, error: "Créneau horaire indisponible" };
  }

  // Check capacity
  if (slot.currentBookings >= slot.maxCapacity) {
    return { success: false, error: "Créneau complet" };
  }

  // Atomically increment
  await ctx.db.patch(slot._id, {
    currentBookings: slot.currentBookings + 1,
    updatedAt: Date.now(),
  });

  return { success: true, slotId: slot._id };
}

/**
 * Release capacity (on cancellation/rejection/expiration)
 */
export async function releaseCapacity(
  ctx: MutationCtx,
  slotId: Id<"timeSlots">
): Promise<void> {
  const slot = await ctx.db.get(slotId);
  if (!slot) return;

  await ctx.db.patch(slotId, {
    currentBookings: Math.max(0, slot.currentBookings - 1),
    updatedAt: Date.now(),
  });
}

/**
 * Release capacity by terminal/date/time (when slot ID not available)
 */
export async function releaseCapacityBySlotInfo(
  ctx: MutationCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<void> {
  const slot = await getSlotForTerminal(ctx, terminalId, date, startTime);
  if (slot) {
    await releaseCapacity(ctx, slot._id);
  }
}

/**
 * Get terminal capacity for a specific date
 * Returns ALL slots based on terminal operating hours, including virtual slots (no bookings yet)
 */
export async function getTerminalCapacityForDate(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string
): Promise<SlotCapacity[]> {
  const terminal = await ctx.db.get(terminalId);
  if (!terminal) return [];

  // Get existing slot records for this date
  const existingSlots = await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .collect();

  // Build map of existing slots by startTime
  const slotMap = new Map(existingSlots.map((s) => [s.startTime, s]));

  // Generate all possible slots based on terminal operating hours
  const results: SlotCapacity[] = [];
  const startHour = parseInt(terminal.operatingHoursStart?.split(":")[0] ?? "6", 10);
  const startMinute = parseInt(terminal.operatingHoursStart?.split(":")[1] ?? "0", 10);
  const endHour = parseInt(terminal.operatingHoursEnd?.split(":")[0] ?? "22", 10);
  const durationMinutes = terminal.slotDurationMinutes ?? 60;

  // Calculate total minutes from start
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const nextMinutes = currentMinutes + durationMinutes;
    const endHourActual = Math.floor(nextMinutes / 60);
    const endMinuteActual = nextMinutes % 60;
    const endTime = `${endHourActual.toString().padStart(2, "0")}:${endMinuteActual.toString().padStart(2, "0")}`;

    const existingSlot = slotMap.get(startTime);

    if (existingSlot) {
      // Real slot with bookings - count auto-validated ones
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", terminalId).eq("preferredDate", date)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("preferredTimeStart"), startTime),
            q.or(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("status"), "confirmed")
            )
          )
        )
        .collect();

      const autoValidatedCount = bookings.filter((b) => b.wasAutoValidated).length;
      const threshold =
        existingSlot.autoValidationThreshold ?? terminal.autoValidationThreshold;
      const maxAutoValidated = Math.floor(
        (existingSlot.maxCapacity * threshold) / 100
      );

      results.push({
        slotId: existingSlot._id,
        date,
        startTime,
        endTime,
        available: existingSlot.isActive
          ? Math.max(0, existingSlot.maxCapacity - existingSlot.currentBookings)
          : 0,
        total: existingSlot.maxCapacity,
        booked: existingSlot.currentBookings,
        utilizationPercent: Math.round(
          (existingSlot.currentBookings / existingSlot.maxCapacity) * 100
        ),
        autoValidationThreshold: threshold,
        autoValidatedCount,
        remainingAutoValidation: Math.max(0, maxAutoValidated - autoValidatedCount),
        isVirtual: false,
        isActive: existingSlot.isActive,
      });
    } else {
      // Virtual slot (no bookings yet) - use terminal defaults
      const threshold = terminal.autoValidationThreshold;
      const maxAutoValidated = Math.floor(
        (terminal.defaultSlotCapacity * threshold) / 100
      );

      results.push({
        slotId: undefined, // No record exists yet
        date,
        startTime,
        endTime,
        available: terminal.defaultSlotCapacity,
        total: terminal.defaultSlotCapacity,
        booked: 0,
        utilizationPercent: 0,
        autoValidationThreshold: threshold,
        autoValidatedCount: 0,
        remainingAutoValidation: maxAutoValidated,
        isVirtual: true, // Flag to indicate this is a computed slot
        isActive: true, // Virtual slots are always active
      });
    }

    currentMinutes = nextMinutes;
  }

  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Recalculate capacity for all slots of a terminal on a date
 */
export async function recalculateTerminalCapacity(
  ctx: MutationCtx,
  terminalId: Id<"terminals">,
  date: string
): Promise<void> {
  const slots = await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .collect();

  for (const slot of slots) {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_date", (q) =>
        q.eq("terminalId", terminalId).eq("preferredDate", date)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("preferredTimeStart"), slot.startTime),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .collect();

    await ctx.db.patch(slot._id, {
      currentBookings: bookings.length,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Get available capacity for a slot (for queries)
 */
export async function getAvailableCapacity(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<CapacityResult> {
  const slot = await getSlotForTerminal(ctx, terminalId, date, startTime);

  if (!slot) {
    // Virtual slot - use terminal defaults
    const terminal = await ctx.db.get(terminalId);
    if (!terminal) {
      return { available: 0, total: 0, booked: 0, utilizationPercent: 0 };
    }

    return {
      available: terminal.defaultSlotCapacity,
      total: terminal.defaultSlotCapacity,
      booked: 0,
      utilizationPercent: 0,
    };
  }

  return {
    available: slot.isActive
      ? Math.max(0, slot.maxCapacity - slot.currentBookings)
      : 0,
    total: slot.maxCapacity,
    booked: slot.currentBookings,
    utilizationPercent: Math.round(
      (slot.currentBookings / slot.maxCapacity) * 100
    ),
  };
}

/**
 * Check if a terminal slot has availability without reserving
 */
export async function hasAvailability(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<boolean> {
  const capacity = await getAvailableCapacity(ctx, terminalId, date, startTime);
  return capacity.available > 0;
}

/**
 * Get capacity utilization percentage
 */
export async function getUtilizationPercent(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<number> {
  const capacity = await getAvailableCapacity(ctx, terminalId, date, startTime);
  return capacity.utilizationPercent;
}
