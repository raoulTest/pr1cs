/**
 * Internal Notification Functions
 * Server-side notification creation and sending
 */
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  notificationTypeValidator,
  notificationChannelValidator,
  type NotificationType,
  type NotificationChannel,
  type Language,
} from "../lib/validators";

// ============================================================================
// NOTIFICATION TEMPLATES (Bilingual)
// ============================================================================

type NotificationTemplate = {
  titleEn: string;
  titleFr: string;
  bodyEn: string;
  bodyFr: string;
};

type TemplateParams = {
  bookingReference?: string;
  terminalName?: string;
  gateName?: string;
  date?: string;
  time?: string;
  reason?: string;
  hoursUntil?: number;
};

function getNotificationTemplate(
  type: NotificationType,
  params: TemplateParams
): NotificationTemplate {
  switch (type) {
    case "booking_created":
      return {
        titleEn: "Booking Created",
        titleFr: "Réservation créée",
        bodyEn: `Your booking ${params.bookingReference} has been created for ${params.date} at ${params.time}. It is pending confirmation.`,
        bodyFr: `Votre réservation ${params.bookingReference} a été créée pour le ${params.date} à ${params.time}. Elle est en attente de confirmation.`,
      };

    case "booking_confirmed":
      return {
        titleEn: "Booking Confirmed",
        titleFr: "Réservation confirmée",
        bodyEn: `Your booking ${params.bookingReference} has been confirmed for ${params.terminalName}, Gate ${params.gateName} on ${params.date} at ${params.time}.`,
        bodyFr: `Votre réservation ${params.bookingReference} a été confirmée pour ${params.terminalName}, Porte ${params.gateName} le ${params.date} à ${params.time}.`,
      };

    case "booking_rejected":
      return {
        titleEn: "Booking Rejected",
        titleFr: "Réservation refusée",
        bodyEn: `Your booking ${params.bookingReference} has been rejected. Reason: ${params.reason || "Not specified"}.`,
        bodyFr: `Votre réservation ${params.bookingReference} a été refusée. Raison: ${params.reason || "Non spécifiée"}.`,
      };

    case "booking_cancelled":
      return {
        titleEn: "Booking Cancelled",
        titleFr: "Réservation annulée",
        bodyEn: `Your booking ${params.bookingReference} has been cancelled.${params.reason ? ` Reason: ${params.reason}` : ""}`,
        bodyFr: `Votre réservation ${params.bookingReference} a été annulée.${params.reason ? ` Raison: ${params.reason}` : ""}`,
      };

    case "booking_modified":
      return {
        titleEn: "Booking Modified",
        titleFr: "Réservation modifiée",
        bodyEn: `Your booking ${params.bookingReference} has been modified. Please review the changes.`,
        bodyFr: `Votre réservation ${params.bookingReference} a été modifiée. Veuillez vérifier les changements.`,
      };

    case "booking_reminder":
      return {
        titleEn: "Booking Reminder",
        titleFr: "Rappel de réservation",
        bodyEn: `Reminder: Your booking ${params.bookingReference} is scheduled in ${params.hoursUntil} hours at ${params.terminalName}, Gate ${params.gateName}.`,
        bodyFr: `Rappel: Votre réservation ${params.bookingReference} est prévue dans ${params.hoursUntil} heures à ${params.terminalName}, Porte ${params.gateName}.`,
      };

    case "booking_expired":
      return {
        titleEn: "Booking Expired",
        titleFr: "Réservation expirée",
        bodyEn: `Your booking ${params.bookingReference} has expired as it was not used within the scheduled time.`,
        bodyFr: `Votre réservation ${params.bookingReference} a expiré car elle n'a pas été utilisée dans les délais prévus.`,
      };

    case "capacity_alert":
      return {
        titleEn: "Capacity Alert",
        titleFr: "Alerte de capacité",
        bodyEn: `High demand detected at ${params.terminalName}. Some time slots may be limited.`,
        bodyFr: `Forte demande détectée à ${params.terminalName}. Certains créneaux horaires peuvent être limités.`,
      };

    case "system_announcement":
      return {
        titleEn: "System Announcement",
        titleFr: "Annonce système",
        bodyEn: params.reason || "Important system update.",
        bodyFr: params.reason || "Mise à jour importante du système.",
      };

    default:
      return {
        titleEn: "Notification",
        titleFr: "Notification",
        bodyEn: "You have a new notification.",
        bodyFr: "Vous avez une nouvelle notification.",
      };
  }
}

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Create a notification for a user
 */
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: notificationTypeValidator,
    channel: notificationChannelValidator,
    params: v.object({
      bookingReference: v.optional(v.string()),
      terminalName: v.optional(v.string()),
      gateName: v.optional(v.string()),
      date: v.optional(v.string()),
      time: v.optional(v.string()),
      reason: v.optional(v.string()),
      hoursUntil: v.optional(v.number()),
    }),
    relatedEntityType: v.optional(
      v.union(v.literal("booking"), v.literal("terminal"), v.literal("time_slot"))
    ),
    relatedEntityId: v.optional(v.string()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const template = getNotificationTemplate(args.type, args.params);

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      channel: args.channel,
      titleEn: template.titleEn,
      titleFr: template.titleFr,
      bodyEn: template.bodyEn,
      bodyFr: template.bodyFr,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      isRead: false,
      createdAt: Date.now(),
    });

    // If channel includes email, queue email send
    // (In production, this would trigger an action to send email)
    if (args.channel === "email" || args.channel === "both") {
      // TODO: Schedule email sending action
      // await ctx.scheduler.runAfter(0, internal.email.sendNotificationEmail, { notificationId });
    }

    return notificationId;
  },
});

/**
 * Send booking notification to carrier company users
 */
export const sendBookingNotification = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    type: notificationTypeValidator,
    additionalParams: v.optional(
      v.object({
        reason: v.optional(v.string()),
      })
    ),
  },
  returns: v.array(v.id("notifications")),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return [];

    // Get related entities
    const [timeSlot, gate, terminal, carrier] = await Promise.all([
      ctx.db.get(booking.timeSlotId),
      ctx.db.get(booking.gateId),
      ctx.db.get(booking.terminalId),
      ctx.db.get(booking.carrierCompanyId),
    ]);

    if (!carrier) return [];

    // Get all active users in the carrier company
    const carrierUsers = await ctx.db
      .query("carrierUsers")
      .withIndex("by_company_and_active", (q) =>
        q.eq("carrierCompanyId", booking.carrierCompanyId).eq("isActive", true)
      )
      .collect();

    const notificationIds: Id<"notifications">[] = [];

    const params: TemplateParams = {
      bookingReference: booking.bookingReference,
      terminalName: terminal?.name,
      gateName: gate?.name,
      date: timeSlot?.date,
      time: timeSlot?.startTime,
      reason: args.additionalParams?.reason,
    };

    // Create notification for each user
    for (const carrierUser of carrierUsers) {
      const notificationId = await ctx.db.insert("notifications", {
        userId: carrierUser.userId,
        type: args.type,
        channel: carrier.notificationChannel,
        ...getNotificationTemplate(args.type, params),
        relatedEntityType: "booking",
        relatedEntityId: booking._id,
        isRead: false,
        createdAt: Date.now(),
      });

      notificationIds.push(notificationId);
    }

    return notificationIds;
  },
});

/**
 * Send reminder notifications for upcoming bookings
 */
export const sendBookingReminders = internalMutation({
  args: {
    hoursBeforeSlot: v.number(),
  },
  returns: v.number(), // Count of reminders sent
  handler: async (ctx, args) => {
    const now = Date.now();
    const targetTime = now + args.hoursBeforeSlot * 60 * 60 * 1000;

    // Find confirmed bookings with time slots approaching
    // We need to find time slots that start around targetTime
    const targetDate = new Date(targetTime);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const hourStr = targetDate.toISOString().slice(11, 16);

    // Get time slots for today and tomorrow that might need reminders
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

        // Check if this slot is within 30 minutes of the target reminder time
        if (Math.abs(hoursUntil - args.hoursBeforeSlot) <= 0.5) {
          // Find confirmed bookings for this slot
          const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_time_slot_and_status", (q) =>
              q.eq("timeSlotId", slot._id).eq("status", "confirmed")
            )
            .collect();

          for (const booking of bookings) {
            // Send reminder notification
            const carrier = await ctx.db.get(booking.carrierCompanyId);
            const terminal = await ctx.db.get(booking.terminalId);
            const gate = await ctx.db.get(booking.gateId);

            if (!carrier) continue;

            const carrierUsers = await ctx.db
              .query("carrierUsers")
              .withIndex("by_company_and_active", (q) =>
                q.eq("carrierCompanyId", booking.carrierCompanyId).eq("isActive", true)
              )
              .collect();

            const params: TemplateParams = {
              bookingReference: booking.bookingReference,
              terminalName: terminal?.name,
              gateName: gate?.name,
              hoursUntil: Math.round(hoursUntil),
            };

            for (const carrierUser of carrierUsers) {
              await ctx.db.insert("notifications", {
                userId: carrierUser.userId,
                type: "booking_reminder",
                channel: carrier.notificationChannel,
                ...getNotificationTemplate("booking_reminder", params),
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

    return reminderCount;
  },
});

/**
 * Helper to send notification to specific users
 */
export async function notifyUsers(
  ctx: MutationCtx,
  userIds: string[],
  type: NotificationType,
  channel: NotificationChannel,
  params: TemplateParams,
  relatedEntity?: { type: "booking" | "terminal" | "time_slot"; id: string }
): Promise<Id<"notifications">[]> {
  const template = getNotificationTemplate(type, params);
  const notificationIds: Id<"notifications">[] = [];

  for (const userId of userIds) {
    const notificationId = await ctx.db.insert("notifications", {
      userId,
      type,
      channel,
      ...template,
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      isRead: false,
      createdAt: Date.now(),
    });

    notificationIds.push(notificationId);
  }

  return notificationIds;
}
