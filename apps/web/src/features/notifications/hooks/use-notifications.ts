/**
 * useNotifications Hook
 * Combined hook for notification queries and mutations
 */
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const { isAuthenticated } = useConvexAuth();

  const notifications = useQuery(
    api.notifications.queries.list,
    isAuthenticated
      ? { limit: options?.limit ?? 20, unreadOnly: options?.unreadOnly }
      : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.queries.unreadCount,
    isAuthenticated ? {} : "skip"
  );

  const markAsReadMutation = useMutation(
    api.notifications.mutations.markAsRead
  );
  const markAllAsReadMutation = useMutation(
    api.notifications.mutations.markAllAsRead
  );

  return {
    notifications,
    unreadCount: unreadCount ?? 0,
    isLoading: notifications === undefined,
    markAsRead: (notificationId: Id<"notifications">) =>
      markAsReadMutation({ notificationId }),
    markAllAsRead: () => markAllAsReadMutation({}),
  };
}
