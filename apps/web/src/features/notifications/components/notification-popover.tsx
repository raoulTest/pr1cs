/**
 * Notification Popover Component
 * Dropdown container with header, notification list, and actions
 */
"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCheckIcon } from "lucide-react";
import { NotificationList } from "./notification-list";
import { useNotifications } from "../hooks/use-notifications";

interface NotificationPopoverProps {
  children: React.ReactNode;
}

export function NotificationPopover({ children }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications({ limit: 20 });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96" sideOffset={8}>
        {/* Header */}
        <PopoverHeader className="flex flex-row items-center justify-between p-3">
          <PopoverTitle className="flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </PopoverTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllAsRead}
              className="text-muted-foreground"
            >
              <CheckCheckIcon className="size-3.5 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </PopoverHeader>

        <Separator />

        {/* Notification List */}
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkAsRead={markAsRead}
          onNotificationClick={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
