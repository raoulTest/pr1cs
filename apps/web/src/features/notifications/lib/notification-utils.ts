/**
 * Notification Utilities
 * Icons, colors, and formatting helpers for notifications
 */
import {
  CalendarCheckIcon,
  CalendarXIcon,
  CalendarClockIcon,
  CalendarIcon,
  AlertTriangleIcon,
  MegaphoneIcon,
  BellIcon,
  type LucideIcon,
} from "lucide-react";

// Notification type to French label
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  booking_created: "Réservation créée",
  booking_confirmed: "Réservation confirmée",
  booking_rejected: "Réservation refusée",
  booking_cancelled: "Réservation annulée",
  booking_modified: "Réservation modifiée",
  booking_reminder: "Rappel de réservation",
  booking_expired: "Réservation expirée",
  capacity_alert: "Alerte de capacité",
  system_announcement: "Annonce système",
};

// Notification type to icon
export const NOTIFICATION_TYPE_ICONS: Record<string, LucideIcon> = {
  booking_created: CalendarIcon,
  booking_confirmed: CalendarCheckIcon,
  booking_rejected: CalendarXIcon,
  booking_cancelled: CalendarXIcon,
  booking_modified: CalendarClockIcon,
  booking_reminder: CalendarClockIcon,
  booking_expired: CalendarXIcon,
  capacity_alert: AlertTriangleIcon,
  system_announcement: MegaphoneIcon,
};

// Notification type to color class
export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  booking_created: "text-blue-500",
  booking_confirmed: "text-green-500",
  booking_rejected: "text-destructive",
  booking_cancelled: "text-muted-foreground",
  booking_modified: "text-amber-500",
  booking_reminder: "text-orange-500",
  booking_expired: "text-muted-foreground",
  capacity_alert: "text-amber-500",
  system_announcement: "text-primary",
};

/**
 * Format a timestamp as relative time in French
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

/**
 * Get the icon for a notification type
 */
export function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_TYPE_ICONS[type] ?? BellIcon;
}

/**
 * Get the color class for a notification type
 */
export function getNotificationColor(type: string): string {
  return NOTIFICATION_TYPE_COLORS[type] ?? "text-muted-foreground";
}
