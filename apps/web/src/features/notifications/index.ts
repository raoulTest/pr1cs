/**
 * Notifications Feature Module
 * Barrel exports for all notification components and hooks
 */

// Components
export { NotificationBell } from "./components/notification-bell";
export { NotificationPopover } from "./components/notification-popover";
export { NotificationList } from "./components/notification-list";
export { NotificationItem } from "./components/notification-item";
export { NotificationEmpty } from "./components/notification-empty";
export {
  NotificationSkeleton,
  NotificationListSkeleton,
} from "./components/notification-skeleton";

// Hooks
export { useNotifications } from "./hooks/use-notifications";

// Utilities
export * from "./lib/notification-utils";
