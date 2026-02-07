/**
 * Notification Item Component
 * Individual notification display with icon, title, body, and time
 */
"use client";

import { cn } from "@/lib/utils";
import {
  getNotificationIcon,
  getNotificationColor,
  formatRelativeTime,
} from "../lib/notification-utils";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
  };
  onMarkAsRead: (id: Id<"notifications">) => void;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full gap-3 p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50",
        !notification.isRead && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center bg-muted",
          colorClass
        )}
      >
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              !notification.isRead && "font-medium"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="size-2 shrink-0 rounded-full bg-primary mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
