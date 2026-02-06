/**
 * Scheduled Internal Functions
 * Background jobs called by cron scheduler
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { releaseCapacity, recalculateCapacity } from "./lib/capacity";
import { internal } from "./_generated/api";

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

    // Find time slots that have ended (date passed or time passed today)
    // We'll look at slots from today and before
    const recentSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_date")
      .filter((q) => q.lte(q.field("date"), todayStr))
      .collect();

    const expiredSlotIds: string[] = [];

    for (const slot of recentSlots) {
      if (slot.date < todayStr) {
        // Past date - definitely expired
        expiredSlotIds.push(slot._id);
      } else if (slot.date === todayStr && slot.endTime < currentTimeStr) {
        // Today but end time has passed
        expiredSlotIds.push(slot._id);
      }
    }

    // Find confirmed bookings for these expired slots
    let expiredCount = 0;

    for (const slotId of expiredSlotIds) {
      const confirmedBookings = await ctx.db
        .query("bookings")
        .withIndex("by_time_slot_and_status", (q) =>
          q.eq("timeSlotId", slotId as any).eq("status", "confirmed")
        )
        .collect();

      for (const booking of confirmedBookings) {
        // Mark as expired
        await ctx.db.patch(booking._id, {
          status: "expired",
          updatedAt: Date.now(),
        });

        // Release capacity (though slot is past, this keeps counts accurate)
        await releaseCapacity(ctx, booking.timeSlotId);

        // Record in history
        await ctx.db.insert("bookingHistory", {
          bookingId: booking._id,
          changeType: "status_changed",
          previousValue: "confirmed",
          newValue: "expired",
          changedAt: Date.now(),
          changedBy: "system",
          note: "Automatically expired - time slot ended",
          requiredRebook: false,
        });

        expiredCount++;
      }
    }

    console.log(`Expired ${expiredCount} bookings`);
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
    // Inline the reminder logic to avoid circular reference
    const now = Date.now();
    const targetTime = now + args.hoursBeforeSlot * 60 * 60 * 1000;
    const targetDate = new Date(targetTime);
    const dateStr = targetDate.toISOString().slice(0, 10);

    // Get time slots for today and tomorrow
    const dates = [
      dateStr,
      new Date(targetTime + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    ];

    let reminderCount = 0;

    for (const date of dates) {
      const timeSlots = await ctx.db
        .query("timeSlots")
        .withIndex("by_date", (q) => q.eq("date", date))
        .collect();

      for (const slot of timeSlots) {
        const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
        const hoursUntil = (slotDateTime.getTime() - now) / (1000 * 60 * 60);

        // Check if within 30 minutes of target reminder time
        if (Math.abs(hoursUntil - args.hoursBeforeSlot) <= 0.5) {
          // Find confirmed bookings for this slot
          const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_time_slot_and_status", (q) =>
              q.eq("timeSlotId", slot._id).eq("status", "confirmed")
            )
            .collect();

          for (const booking of bookings) {
            const carrier = await ctx.db.get(booking.carrierCompanyId);
            const terminal = await ctx.db.get(booking.terminalId);
            const gate = await ctx.db.get(booking.gateId);

            if (!carrier) continue;

            // Get carrier users
            const carrierUsers = await ctx.db
              .query("carrierUsers")
              .withIndex("by_company_and_active", (q) =>
                q.eq("carrierCompanyId", booking.carrierCompanyId).eq("isActive", true)
              )
              .collect();

            for (const carrierUser of carrierUsers) {
              await ctx.db.insert("notifications", {
                userId: carrierUser.userId,
                type: "booking_reminder",
                channel: carrier.notificationChannel,
                titleEn: "Booking Reminder",
                titleFr: "Rappel de réservation",
                bodyEn: `Reminder: Your booking ${booking.bookingReference} is scheduled in ${Math.round(hoursUntil)} hours at ${terminal?.name ?? "Terminal"}, Gate ${gate?.name ?? "Gate"}.`,
                bodyFr: `Rappel: Votre réservation ${booking.bookingReference} est prévue dans ${Math.round(hoursUntil)} heures à ${terminal?.name ?? "Terminal"}, Porte ${gate?.name ?? "Porte"}.`,
                relatedEntityType: "booking",
                relatedEntityId: booking._id,
                isRead: false,
                createdAt: Date.now(),
              });

              reminderCount++;
            }
          }
        }
      }
    }

    console.log(`Sent ${reminderCount} booking reminders`);
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

    console.log(`Deleted ${oldNotifications.length} old notifications`);
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

    console.log(`Deleted ${oldHistory.length} old booking history entries`);
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

      // Count actual active bookings
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .collect();

      const activeCount = bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
      ).length;

      // Fix if mismatch
      if (slot.currentBookings !== activeCount) {
        console.log(
          `Fixing slot ${slot._id}: ${slot.currentBookings} -> ${activeCount}`
        );
        await ctx.db.patch(slot._id, {
          currentBookings: activeCount,
          updatedAt: Date.now(),
        });
        slotsFixed++;
      }
    }

    console.log(`Checked ${slotsChecked} slots, fixed ${slotsFixed}`);
    return { slotsChecked, slotsFixed };
  },
});
