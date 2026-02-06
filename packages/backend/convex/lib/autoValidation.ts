/**
 * Auto-Validation Engine
 * Determines if a booking should be auto-approved based on slot utilization
 * 
 * Key concepts:
 * - Each terminal has an autoValidationThreshold (0-100%)
 * - Slots can override with their own threshold
 * - First N% of slot capacity gets auto-validated
 * - Once threshold is reached, bookings require manual approval
 */
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getSlotForTerminal } from "./capacity";

export interface AutoValidationResult {
  shouldAutoValidate: boolean;
  threshold: number;
  maxAutoValidated: number;
  currentAutoValidated: number;
  remainingAutoValidation: number;
  reason: string;
}

/**
 * Determine if a booking should be auto-validated based on current slot utilization
 * 
 * @param ctx - Query or mutation context
 * @param terminalId - Terminal ID
 * @param date - Booking date (YYYY-MM-DD)
 * @param startTime - Slot start time (HH:mm)
 * @returns Auto-validation decision with reasoning
 */
export async function shouldAutoValidateBooking(
  ctx: QueryCtx | MutationCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<AutoValidationResult> {
  // Get terminal for default threshold
  const terminal = await ctx.db.get(terminalId);
  if (!terminal) {
    return {
      shouldAutoValidate: false,
      threshold: 0,
      maxAutoValidated: 0,
      currentAutoValidated: 0,
      remainingAutoValidation: 0,
      reason: "Terminal introuvable",
    };
  }

  // Get existing slot (may not exist yet)
  const slot = await getSlotForTerminal(ctx, terminalId, date, startTime);

  // Determine threshold (slot override or terminal default)
  const threshold = slot?.autoValidationThreshold ?? terminal.autoValidationThreshold;
  const maxCapacity = slot?.maxCapacity ?? terminal.defaultSlotCapacity;

  // Calculate max auto-validated bookings allowed
  const maxAutoValidated = Math.floor((maxCapacity * threshold) / 100);

  // Count current auto-validated bookings for this slot
  const autoValidatedBookings = await ctx.db
    .query("bookings")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("preferredDate", date)
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("preferredTimeStart"), startTime),
        q.eq(q.field("wasAutoValidated"), true),
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("status"), "consumed")
        )
      )
    )
    .collect();

  const currentAutoValidated = autoValidatedBookings.length;
  const remainingAutoValidation = Math.max(0, maxAutoValidated - currentAutoValidated);

  // Determine if auto-validation should happen
  const shouldAutoValidate = remainingAutoValidation > 0;

  let reason: string;
  if (threshold === 0) {
    reason = "Validation automatique désactivée pour ce terminal";
  } else if (shouldAutoValidate) {
    reason = `Créneau éligible à la validation automatique (${currentAutoValidated}/${maxAutoValidated} utilisés)`;
  } else {
    reason = `Seuil de validation automatique atteint (${currentAutoValidated}/${maxAutoValidated})`;
  }

  return {
    shouldAutoValidate,
    threshold,
    maxAutoValidated,
    currentAutoValidated,
    remainingAutoValidation,
    reason,
  };
}

/**
 * Get auto-validation status for a slot (for display purposes)
 */
export async function getSlotAutoValidationStatus(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string,
  startTime: string
): Promise<{
  threshold: number;
  maxAutoValidated: number;
  currentAutoValidated: number;
  remainingAutoValidation: number;
  utilizationPercent: number;
}> {
  const result = await shouldAutoValidateBooking(ctx, terminalId, date, startTime);
  
  return {
    threshold: result.threshold,
    maxAutoValidated: result.maxAutoValidated,
    currentAutoValidated: result.currentAutoValidated,
    remainingAutoValidation: result.remainingAutoValidation,
    utilizationPercent: result.maxAutoValidated > 0 
      ? Math.round((result.currentAutoValidated / result.maxAutoValidated) * 100)
      : 0,
  };
}

/**
 * Get system-wide auto-validation configuration
 */
export async function getSystemAutoValidationConfig(ctx: QueryCtx): Promise<{
  defaultThreshold: number;
  isEnabled: boolean;
}> {
  const config = await ctx.db.query("systemConfig").first();
  
  const defaultThreshold = config?.defaultAutoValidationThreshold ?? 0;
  
  return {
    defaultThreshold,
    isEnabled: defaultThreshold > 0,
  };
}

/**
 * Update auto-validation threshold for a terminal
 * Returns the new threshold
 */
export async function updateTerminalAutoValidationThreshold(
  ctx: MutationCtx,
  terminalId: Id<"terminals">,
  newThreshold: number
): Promise<number> {
  // Clamp threshold between 0 and 100
  const clampedThreshold = Math.max(0, Math.min(100, newThreshold));
  
  await ctx.db.patch(terminalId, {
    autoValidationThreshold: clampedThreshold,
    updatedAt: Date.now(),
  });
  
  return clampedThreshold;
}

/**
 * Update auto-validation threshold for a specific slot
 * Pass null to reset to terminal default
 */
export async function updateSlotAutoValidationThreshold(
  ctx: MutationCtx,
  slotId: Id<"timeSlots">,
  newThreshold: number | null
): Promise<number | null> {
  const slot = await ctx.db.get(slotId);
  if (!slot) return null;
  
  // Clamp threshold between 0 and 100, or set to undefined for terminal default
  const clampedThreshold = newThreshold !== null 
    ? Math.max(0, Math.min(100, newThreshold))
    : undefined;
  
  await ctx.db.patch(slotId, {
    autoValidationThreshold: clampedThreshold,
    updatedAt: Date.now(),
  });
  
  return clampedThreshold ?? null;
}

/**
 * Check if a terminal has auto-validation enabled
 */
export async function isAutoValidationEnabled(
  ctx: QueryCtx,
  terminalId: Id<"terminals">
): Promise<boolean> {
  const terminal = await ctx.db.get(terminalId);
  if (!terminal) return false;
  
  return terminal.autoValidationThreshold > 0;
}

/**
 * Get auto-validation statistics for a terminal on a specific date
 */
export async function getTerminalAutoValidationStats(
  ctx: QueryCtx,
  terminalId: Id<"terminals">,
  date: string
): Promise<{
  totalSlots: number;
  slotsWithAutoValidation: number;
  totalAutoValidated: number;
  totalManuallyApproved: number;
}> {
  // Get all bookings for the terminal on this date
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("preferredDate", date)
    )
    .filter((q) =>
      q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "confirmed"),
        q.eq(q.field("status"), "consumed")
      )
    )
    .collect();

  // Get slots for this date
  const slots = await ctx.db
    .query("timeSlots")
    .withIndex("by_terminal_and_date", (q) =>
      q.eq("terminalId", terminalId).eq("date", date)
    )
    .collect();

  const terminal = await ctx.db.get(terminalId);
  const slotsWithAutoValidation = slots.filter((s) => {
    const threshold = s.autoValidationThreshold ?? terminal?.autoValidationThreshold ?? 0;
    return threshold > 0;
  }).length;

  const totalAutoValidated = bookings.filter((b) => b.wasAutoValidated).length;
  const confirmedNotAuto = bookings.filter(
    (b) => b.status === "confirmed" && !b.wasAutoValidated
  ).length;

  return {
    totalSlots: slots.length,
    slotsWithAutoValidation,
    totalAutoValidated,
    totalManuallyApproved: confirmedNotAuto,
  };
}
