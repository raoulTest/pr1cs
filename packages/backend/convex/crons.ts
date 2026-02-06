/**
 * APCS Scheduled Jobs (Cron)
 * Automated background tasks for booking management
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ============================================================================
// BOOKING EXPIRATION
// ============================================================================

/**
 * Expire old bookings that were not consumed
 * Runs every 15 minutes
 */
crons.interval(
  "expire old bookings",
  { minutes: 15 },
  internal.scheduled.expireOldBookings,
  {}
);

// ============================================================================
// BOOKING REMINDERS
// ============================================================================

/**
 * Send 24-hour reminders for upcoming confirmed bookings
 * Runs every hour
 */
crons.interval(
  "send 24h booking reminders",
  { hours: 1 },
  internal.scheduled.sendBookingReminders,
  { hoursBeforeSlot: 24 }
);

/**
 * Send 2-hour reminders for upcoming confirmed bookings
 * Runs every 30 minutes
 */
crons.interval(
  "send 2h booking reminders",
  { minutes: 30 },
  internal.scheduled.sendBookingReminders,
  { hoursBeforeSlot: 2 }
);

// ============================================================================
// CLEANUP JOBS
// ============================================================================

/**
 * Cleanup old notifications (older than 30 days)
 * Runs daily at 2 AM UTC
 */
crons.cron(
  "cleanup old notifications",
  "0 2 * * *",
  internal.scheduled.cleanupOldNotifications,
  { daysToKeep: 30 }
);

/**
 * Cleanup old booking history (audit logs older than 90 days)
 * Runs weekly on Sunday at 3 AM UTC
 */
crons.cron(
  "cleanup old booking history",
  "0 3 * * 0",
  internal.scheduled.cleanupOldBookingHistory,
  { daysToKeep: 90 }
);

// ============================================================================
// DATA CONSISTENCY CHECKS
// ============================================================================

/**
 * Recalculate time slot capacity (data consistency check)
 * Runs daily at 4 AM UTC
 */
crons.cron(
  "recalculate slot capacity",
  "0 4 * * *",
  internal.scheduled.recalculateAllCapacity,
  {}
);

export default crons;
