/**
 * Scheduled Internal Functions
 * Background jobs called by cron scheduler
 * 
 * Updated: New schema with preferredDate/preferredTimeStart, carrierId
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { releaseCapacityBySlotInfo } from "./lib/capacity";

// ============================================================================
// BOOKING EXPIRATION
// ============================================================================

/**
 * Expire bookings for time slots that have passed
 * Called by cron every 15 minutes
 */
export const expireOldBookings = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentTimeStr = now.toISOString().slice(11, 16);

    // Find confirmed bookings that have passed their time slot
    // Get today's and past bookings
    const recentBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    let expiredCount = 0;

    for (const booking of recentBookings) {
      let shouldExpire = false;

      if (booking.preferredDate < todayStr) {
        // Past date - definitely expired
        shouldExpire = true;
      } else if (
        booking.preferredDate === todayStr &&
        booking.preferredTimeEnd < currentTimeStr
      ) {
        // Today but end time has passed
        shouldExpire = true;
      }

      if (shouldExpire) {
        // Mark as expired
        await ctx.db.patch(booking._id, {
          status: "expired",
          expiredAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Release capacity
        await releaseCapacityBySlotInfo(
          ctx,
          booking.terminalId,
          booking.preferredDate,
          booking.preferredTimeStart
        );

        // Record in history
        await ctx.db.insert("bookingHistory", {
          bookingId: booking._id,
          changeType: "status_changed",
          previousValue: "confirmed",
          newValue: "expired",
          changedAt: Date.now(),
          changedBy: "system",
          note: "Automatiquement expiré - créneau horaire terminé",
          requiredRebook: false,
        });

        expiredCount++;
      }
    }

    console.log(`Expiré ${expiredCount} réservations`);
    return expiredCount;
  },
});

// ============================================================================
// BOOKING REMINDERS
// ============================================================================

/**
 * Send booking reminders
 * Called by cron with different hoursBeforeSlot values
 */
export const sendBookingReminders = internalMutation({
  args: {
    hoursBeforeSlot: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args): Promise<number> => {
    const now = Date.now();
    const targetTime = now + args.hoursBeforeSlot * 60 * 60 * 1000;
    const targetDate = new Date(targetTime);
    const dateStr = targetDate.toISOString().slice(0, 10);

    // Get dates to check (today and tomorrow)
    const dates = [
      dateStr,
      new Date(targetTime + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    ];

    let reminderCount = 0;

    for (const date of dates) {
      // Get confirmed bookings for this date
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date", (q) => q.eq("preferredDate", date))
        .filter((q) => q.eq(q.field("status"), "confirmed"))
        .collect();

      for (const booking of bookings) {
        const slotDateTime = new Date(
          `${booking.preferredDate}T${booking.preferredTimeStart}`
        );
        const hoursUntil = (slotDateTime.getTime() - now) / (1000 * 60 * 60);

        // Check if within 30 minutes of target reminder time
        if (Math.abs(hoursUntil - args.hoursBeforeSlot) <= 0.5) {
          const terminal = await ctx.db.get(booking.terminalId);

          // Gate is optional
          let gateName = "";
          if (booking.gateId) {
            const gate = await ctx.db.get(booking.gateId);
            gateName = gate?.name ?? "";
          }

          // Get carrier profile for notification preferences
          const carrierProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", booking.carrierId))
            .unique();

          await ctx.db.insert("notifications", {
            userId: booking.carrierId,
            type: "booking_reminder",
            channel: carrierProfile?.notificationChannel ?? "in_app",
            title: "Rappel de réservation",
            body: `Rappel: Votre réservation ${booking.bookingReference} est prévue dans ${Math.round(hoursUntil)} heures à ${terminal?.name ?? "Terminal"}${gateName ? `, Porte ${gateName}` : ""}.`,
            relatedEntityType: "booking",
            relatedEntityId: booking._id,
            isRead: false,
            createdAt: Date.now(),
          });

          reminderCount++;
        }
      }
    }

    console.log(`Envoyé ${reminderCount} rappels de réservation`);
    return reminderCount;
  },
});

// ============================================================================
// CLEANUP JOBS
// ============================================================================

/**
 * Cleanup old read notifications
 */
export const cleanupOldNotifications = internalMutation({
  args: {
    daysToKeep: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.daysToKeep * 24 * 60 * 60 * 1000;

    // Get old read notifications
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_created_at")
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cutoffTime),
          q.eq(q.field("isRead"), true)
        )
      )
      .collect();

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }

    console.log(`Supprimé ${oldNotifications.length} anciennes notifications`);
    return oldNotifications.length;
  },
});

/**
 * Cleanup old booking history entries
 */
export const cleanupOldBookingHistory = internalMutation({
  args: {
    daysToKeep: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.daysToKeep * 24 * 60 * 60 * 1000;

    const oldHistory = await ctx.db
      .query("bookingHistory")
      .withIndex("by_changed_at")
      .filter((q) => q.lt(q.field("changedAt"), cutoffTime))
      .collect();

    for (const entry of oldHistory) {
      await ctx.db.delete(entry._id);
    }

    console.log(`Supprimé ${oldHistory.length} anciennes entrées d'historique`);
    return oldHistory.length;
  },
});

// ============================================================================
// DATA CONSISTENCY
// ============================================================================

/**
 * Recalculate capacity for all active time slots
 * This fixes any inconsistencies in currentBookings counts
 */
export const recalculateAllCapacity = internalMutation({
  args: {},
  returns: v.object({
    slotsChecked: v.number(),
    slotsFixed: v.number(),
  }),
  handler: async (ctx) => {
    // Only check recent and future time slots
    const todayStr = new Date().toISOString().slice(0, 10);

    const activeSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_date")
      .filter((q) => q.gte(q.field("date"), todayStr))
      .collect();

    let slotsChecked = 0;
    let slotsFixed = 0;

    for (const slot of activeSlots) {
      slotsChecked++;

      // Count actual active bookings using terminal and date
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", slot.terminalId).eq("preferredDate", slot.date)
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

      const activeCount = bookings.length;

      // Fix if mismatch
      if (slot.currentBookings !== activeCount) {
        console.log(
          `Correction slot ${slot._id}: ${slot.currentBookings} -> ${activeCount}`
        );
        await ctx.db.patch(slot._id, {
          currentBookings: activeCount,
          updatedAt: Date.now(),
        });
        slotsFixed++;
      }
    }

    console.log(`Vérifié ${slotsChecked} créneaux, corrigé ${slotsFixed}`);
    return { slotsChecked, slotsFixed };
  },
});
