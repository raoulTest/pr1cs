/**
 * useNotifications Hook
 * Combined hook for notification queries and mutations
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const notifications = useQuery(api.notifications.queries.list, {
    limit: options?.limit ?? 20,
    unreadOnly: options?.unreadOnly,
  });

  const unreadCount = useQuery(api.notifications.queries.unreadCount);

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
