/**
 * Notification Bell Component
 * Bell icon trigger with unread count badge
 */
"use client";

import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "../hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <NotificationPopover>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        className="relative"
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 flex items-center justify-center",
              "min-w-4 h-4 px-1 text-[10px] font-medium",
              "bg-destructive text-destructive-foreground",
              "animate-in zoom-in-50 duration-200"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </NotificationPopover>
  );
}
