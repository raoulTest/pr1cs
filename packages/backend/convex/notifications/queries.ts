/**
 * Notification Queries
 * Read operations for user notifications
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "../lib/permissions";
import {
  notificationTypeValidator,
  notificationChannelValidator,
  languageValidator,
} from "../lib/validators";

// ============================================================================
// RETURN TYPE VALIDATORS
// ============================================================================

const notificationItemValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  type: notificationTypeValidator,
  channel: notificationChannelValidator,
  // Bilingual content
  titleEn: v.string(),
  titleFr: v.string(),
  bodyEn: v.string(),
  bodyFr: v.string(),
  // Status
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  // Related entity
  relatedEntityType: v.optional(
    v.union(v.literal("booking"), v.literal("terminal"), v.literal("time_slot"))
  ),
  relatedEntityId: v.optional(v.string()),
  // Timestamp
  createdAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List notifications for the current user
 */
export const list = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(notificationItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit ?? 50;

    let notificationsQuery;
    if (args.unreadOnly) {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) =>
          q.eq("userId", user.userId).eq("isRead", false)
        )
        .order("desc");
    } else {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", user.userId))
        .order("desc");
    }

    const notifications = await notificationsQuery.take(limit);

    return notifications.map((n) => ({
      _id: n._id,
      _creationTime: n._creationTime,
      type: n.type,
      channel: n.channel,
      titleEn: n.titleEn,
      titleFr: n.titleFr,
      bodyEn: n.bodyEn,
      bodyFr: n.bodyFr,
      isRead: n.isRead,
      readAt: n.readAt,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      createdAt: n.createdAt,
    }));
  },
});

/**
 * Get unread notification count
 */
export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user.userId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

/**
 * Get a single notification
 */
export const get = query({
  args: { notificationId: v.id("notifications") },
  returns: v.union(notificationItemValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;

    // Users can only view their own notifications
    if (notification.userId !== user.userId) {
      return null;
    }

    return {
      _id: notification._id,
      _creationTime: notification._creationTime,
      type: notification.type,
      channel: notification.channel,
      titleEn: notification.titleEn,
      titleFr: notification.titleFr,
      bodyEn: notification.bodyEn,
      bodyFr: notification.bodyFr,
      isRead: notification.isRead,
      readAt: notification.readAt,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      createdAt: notification.createdAt,
    };
  },
});

/**
 * List notifications by type
 */
export const listByType = query({
  args: {
    type: notificationTypeValidator,
    limit: v.optional(v.number()),
  },
  returns: v.array(notificationItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", user.userId).eq("type", args.type)
      )
      .order("desc")
      .take(limit);

    return notifications.map((n) => ({
      _id: n._id,
      _creationTime: n._creationTime,
      type: n.type,
      channel: n.channel,
      titleEn: n.titleEn,
      titleFr: n.titleFr,
      bodyEn: n.bodyEn,
      bodyFr: n.bodyFr,
      isRead: n.isRead,
      readAt: n.readAt,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      createdAt: n.createdAt,
    }));
  },
});
