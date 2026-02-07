/**
 * Notification List Component
 * Scrollable list of notifications with loading and empty states
 */
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./notification-item";
import { NotificationEmpty } from "./notification-empty";
import { NotificationListSkeleton } from "./notification-skeleton";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface Notification {
  _id: Id<"notifications">;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface NotificationListProps {
  notifications: Notification[] | undefined;
  isLoading: boolean;
  onMarkAsRead: (id: Id<"notifications">) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onNotificationClick,
}: NotificationListProps) {
  if (isLoading) {
    return <NotificationListSkeleton count={4} />;
  }

  if (!notifications || notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <div className="h-[350px]">
      <ScrollArea className="h-full">
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onClick={() => onNotificationClick?.(notification)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
