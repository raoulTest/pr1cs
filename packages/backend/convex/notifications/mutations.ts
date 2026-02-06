/**
 * Notification Mutations
 * Mark notifications as read
 */
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthenticatedUser } from "../lib/permissions";

/**
 * Mark a single notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification not found",
      });
    }

    // Users can only mark their own notifications
    if (notification.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only manage your own notifications",
      });
    }

    if (notification.isRead) {
      return null; // Already read, no-op
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return null;
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {},
  returns: v.number(), // Returns count of notifications marked as read
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user.userId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return unread.length;
  },
});

/**
 * Delete old read notifications (cleanup)
 * Keeps notifications for a configurable number of days
 */
export const deleteOldNotifications = mutation({
  args: {
    daysToKeep: v.optional(v.number()), // Default 30 days
  },
  returns: v.number(), // Returns count of deleted notifications
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const daysToKeep = args.daysToKeep ?? 30;
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    // Get old read notifications for this user
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user.userId).eq("isRead", true)
      )
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }

    return oldNotifications.length;
  },
});
