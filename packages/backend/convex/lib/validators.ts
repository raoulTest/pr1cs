/**
 * Shared validators for APCS domain
 * Re-exported from schema for use in function definitions
 */
import { v, Infer } from "convex/values";

// ============================================================================
// TYPE VALIDATORS (matching schema.ts)
// ============================================================================

/** APCS user roles */
export const apcsRoleValidator = v.union(
  v.literal("port_admin"),
  v.literal("terminal_operator"),
  v.literal("carrier")
);
export type ApcsRole = Infer<typeof apcsRoleValidator>;

/** Booking status lifecycle */
export const bookingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("rejected"),
  v.literal("consumed"),
  v.literal("cancelled"),
  v.literal("expired")
);
export type BookingStatus = Infer<typeof bookingStatusValidator>;

/** Truck size/weight class */
export const truckClassValidator = v.union(
  v.literal("light"),
  v.literal("medium"),
  v.literal("heavy"),
  v.literal("super_heavy")
);
export type TruckClass = Infer<typeof truckClassValidator>;

/** Truck type */
export const truckTypeValidator = v.union(
  v.literal("container"),
  v.literal("flatbed"),
  v.literal("tanker"),
  v.literal("refrigerated"),
  v.literal("bulk"),
  v.literal("general")
);
export type TruckType = Infer<typeof truckTypeValidator>;

/** Notification type */
export const notificationTypeValidator = v.union(
  v.literal("booking_created"),
  v.literal("booking_confirmed"),
  v.literal("booking_rejected"),
  v.literal("booking_cancelled"),
  v.literal("booking_modified"),
  v.literal("booking_reminder"),
  v.literal("booking_expired"),
  v.literal("capacity_alert"),
  v.literal("system_announcement")
);
export type NotificationType = Infer<typeof notificationTypeValidator>;

/** Notification channel */
export const notificationChannelValidator = v.union(
  v.literal("in_app"),
  v.literal("email"),
  v.literal("both")
);
export type NotificationChannel = Infer<typeof notificationChannelValidator>;

/** Language preference */
export const languageValidator = v.union(v.literal("en"), v.literal("fr"));
export type Language = Infer<typeof languageValidator>;

/** Booking history change types */
export const bookingChangeTypeValidator = v.union(
  v.literal("created"),
  v.literal("status_changed"),
  v.literal("time_slot_changed"),
  v.literal("truck_changed"),
  v.literal("driver_updated"),
  v.literal("details_updated")
);
export type BookingChangeType = Infer<typeof bookingChangeTypeValidator>;

// ============================================================================
// COMPOSITE VALIDATORS (for function arguments)
// ============================================================================

/** Terminal input for creation */
export const terminalInputValidator = v.object({
  name: v.string(),
  code: v.string(),
  address: v.optional(v.string()),
  timezone: v.string(),
});

/** Gate input for creation */
export const gateInputValidator = v.object({
  terminalId: v.id("terminals"),
  name: v.string(),
  code: v.string(),
  description: v.optional(v.string()),
  defaultCapacity: v.number(),
  allowedTruckTypes: v.array(truckTypeValidator),
  allowedTruckClasses: v.array(truckClassValidator),
});

/** Time slot input for creation */
export const timeSlotInputValidator = v.object({
  gateId: v.id("gates"),
  date: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  maxCapacity: v.number(),
});

/** Carrier company input for creation */
export const carrierCompanyInputValidator = v.object({
  name: v.string(),
  code: v.string(),
  taxId: v.optional(v.string()),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  preferredLanguage: languageValidator,
  notificationChannel: notificationChannelValidator,
});

/** Truck input for creation */
export const truckInputValidator = v.object({
  carrierCompanyId: v.id("carrierCompanies"),
  licensePlate: v.string(),
  truckType: truckTypeValidator,
  truckClass: truckClassValidator,
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  year: v.optional(v.number()),
  maxWeight: v.optional(v.number()),
});

/** Booking input for creation */
export const bookingInputValidator = v.object({
  timeSlotId: v.id("timeSlots"),
  truckId: v.id("trucks"),
  driverName: v.optional(v.string()),
  driverPhone: v.optional(v.string()),
  driverIdNumber: v.optional(v.string()),
  containerNumber: v.optional(v.string()),
  cargoDescription: v.optional(v.string()),
});

/** User profile input */
export const userProfileInputValidator = v.object({
  apcsRole: v.optional(apcsRoleValidator),
  preferredLanguage: languageValidator,
  notificationChannel: notificationChannelValidator,
  phone: v.optional(v.string()),
});

// ============================================================================
// UTILITY CONSTANTS
// ============================================================================

/** All truck types for validation */
export const ALL_TRUCK_TYPES: TruckType[] = [
  "container",
  "flatbed",
  "tanker",
  "refrigerated",
  "bulk",
  "general",
];

/** All truck classes for validation */
export const ALL_TRUCK_CLASSES: TruckClass[] = [
  "light",
  "medium",
  "heavy",
  "super_heavy",
];

/** Booking status transitions */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> =
  {
    pending: ["confirmed", "rejected", "cancelled"],
    confirmed: ["consumed", "cancelled", "expired"],
    rejected: [],
    consumed: [],
    cancelled: [],
    expired: [],
  };

/** Check if a status transition is valid */
export function isValidStatusTransition(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return BOOKING_STATUS_TRANSITIONS[from].includes(to);
}
