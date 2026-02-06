/**
 * Internal Notification Functions
 * Server-side notification creation and sending
 * 
 * Updated: French only, new schema (carrierId not carrierCompanyId)
 */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  notificationTypeValidator,
  notificationChannelValidator,
  type NotificationType,
  type NotificationChannel,
} from "../lib/validators";

// ============================================================================
// NOTIFICATION TEMPLATES (French only)
// ============================================================================

type NotificationTemplate = {
  title: string;
  body: string;
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
        title: "Réservation créée",
        body: `Votre réservation ${params.bookingReference} a été créée pour le ${params.date} à ${params.time}. Elle est en attente de confirmation.`,
      };

    case "booking_confirmed":
      return {
        title: "Réservation confirmée",
        body: `Votre réservation ${params.bookingReference} a été confirmée pour ${params.terminalName}${params.gateName ? `, Porte ${params.gateName}` : ""} le ${params.date} à ${params.time}.`,
      };

    case "booking_rejected":
      return {
        title: "Réservation refusée",
        body: `Votre réservation ${params.bookingReference} a été refusée. Raison: ${params.reason || "Non spécifiée"}.`,
      };

    case "booking_cancelled":
      return {
        title: "Réservation annulée",
        body: `Votre réservation ${params.bookingReference} a été annulée.${params.reason ? ` Raison: ${params.reason}` : ""}`,
      };

    case "booking_modified":
      return {
        title: "Réservation modifiée",
        body: `Votre réservation ${params.bookingReference} a été modifiée. Veuillez vérifier les changements.`,
      };

    case "booking_reminder":
      return {
        title: "Rappel de réservation",
        body: `Rappel: Votre réservation ${params.bookingReference} est prévue dans ${params.hoursUntil} heures à ${params.terminalName}${params.gateName ? `, Porte ${params.gateName}` : ""}.`,
      };

    case "booking_expired":
      return {
        title: "Réservation expirée",
        body: `Votre réservation ${params.bookingReference} a expiré car elle n'a pas été utilisée dans les délais prévus.`,
      };

    case "capacity_alert":
      return {
        title: "Alerte de capacité",
        body: `Forte demande détectée à ${params.terminalName}. Certains créneaux horaires peuvent être limités.`,
      };

    case "system_announcement":
      return {
        title: "Annonce système",
        body: params.reason || "Mise à jour importante du système.",
      };

    default:
      return {
        title: "Notification",
        body: "Vous avez une nouvelle notification.",
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
      title: template.title,
      body: template.body,
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
 * Send booking notification to carrier user
 * Updated: Direct to carrier user (no more carrierCompanies/carrierUsers)
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
    const terminal = await ctx.db.get(booking.terminalId);
    
    // Gate is optional (assigned at confirmation)
    let gate = null;
    if (booking.gateId) {
      gate = await ctx.db.get(booking.gateId);
    }

    // Get carrier's user profile for notification preferences
    const carrierProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", booking.carrierId))
      .unique();

    const notificationIds: Id<"notifications">[] = [];

    const params: TemplateParams = {
      bookingReference: booking.bookingReference,
      terminalName: terminal?.name,
      gateName: gate?.name,
      date: booking.preferredDate,
      time: booking.preferredTimeStart,
      reason: args.additionalParams?.reason,
    };

    const template = getNotificationTemplate(args.type, params);

    // Create notification for the carrier
    const notificationId = await ctx.db.insert("notifications", {
      userId: booking.carrierId,
      type: args.type,
      channel: carrierProfile?.notificationChannel ?? "in_app",
      title: template.title,
      body: template.body,
      relatedEntityType: "booking",
      relatedEntityId: booking._id,
      isRead: false,
      createdAt: Date.now(),
    });

    notificationIds.push(notificationId);

    return notificationIds;
  },
});

/**
 * Send reminder notifications for upcoming bookings
 * Updated: Uses new booking schema with preferredDate/preferredTimeStart
 */
export const sendBookingReminders = internalMutation({
  args: {
    hoursBeforeSlot: v.number(),
  },
  returns: v.number(), // Count of reminders sent
  handler: async (ctx, args) => {
    const now = Date.now();
    const targetTime = now + args.hoursBeforeSlot * 60 * 60 * 1000;

    // Find confirmed bookings with time approaching
    const targetDate = new Date(targetTime);
    const dateStr = targetDate.toISOString().slice(0, 10);

    // Get time slots for today and tomorrow
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
        const slotDateTime = new Date(`${booking.preferredDate}T${booking.preferredTimeStart}`);
        const hoursUntil = (slotDateTime.getTime() - now) / (1000 * 60 * 60);

        // Check if within 30 minutes of target reminder time
        if (Math.abs(hoursUntil - args.hoursBeforeSlot) <= 0.5) {
          const terminal = await ctx.db.get(booking.terminalId);
          
          // Gate is optional
          let gate = null;
          if (booking.gateId) {
            gate = await ctx.db.get(booking.gateId);
          }

          // Get carrier profile for notification preferences
          const carrierProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", booking.carrierId))
            .unique();

          const params: TemplateParams = {
            bookingReference: booking.bookingReference,
            terminalName: terminal?.name,
            gateName: gate?.name,
            hoursUntil: Math.round(hoursUntil),
          };

          const template = getNotificationTemplate("booking_reminder", params);

          await ctx.db.insert("notifications", {
            userId: booking.carrierId,
            type: "booking_reminder",
            channel: carrierProfile?.notificationChannel ?? "in_app",
            title: template.title,
            body: template.body,
            relatedEntityType: "booking",
            relatedEntityId: booking._id,
            isRead: false,
            createdAt: Date.now(),
          });

          reminderCount++;
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
      title: template.title,
      body: template.body,
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      isRead: false,
      createdAt: Date.now(),
    });

    notificationIds.push(notificationId);
  }

  return notificationIds;
}
