/**
 * Shared validators for APCS domain
 * Re-exported from schema for use in function definitions
 */
import { v, type Infer } from "convex/values";

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

/** Container type (ISO standard classifications) */
export const containerTypeValidator = v.union(
  v.literal("dry"),
  v.literal("reefer"),
  v.literal("open_top"),
  v.literal("flat_rack"),
  v.literal("tank"),
  v.literal("hazardous")
);
export type ContainerType = Infer<typeof containerTypeValidator>;

/** Container dimensions (ISO standard) */
export const containerDimensionsValidator = v.union(
  v.literal("20ft"),
  v.literal("40ft"),
  v.literal("40ft_hc"),
  v.literal("45ft")
);
export type ContainerDimensions = Infer<typeof containerDimensionsValidator>;

/** Container weight class */
export const containerWeightClassValidator = v.union(
  v.literal("light"),
  v.literal("medium"),
  v.literal("heavy"),
  v.literal("super_heavy")
);
export type ContainerWeightClass = Infer<typeof containerWeightClassValidator>;

/** Container operation type */
export const containerOperationValidator = v.union(
  v.literal("pick_up"),
  v.literal("drop_off")
);
export type ContainerOperation = Infer<typeof containerOperationValidator>;

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

/** Language preference - French only */
export const languageValidator = v.literal("fr");
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

/** Audit action types */
export const auditActionValidator = v.union(
  v.literal("query"),
  v.literal("mutation"),
  v.literal("ai_tool_call"),
  v.literal("login"),
  v.literal("logout"),
  v.literal("failed_auth"),
  v.literal("permission_denied")
);
export type AuditAction = Infer<typeof auditActionValidator>;

/** Aggregation period */
export const aggregationPeriodValidator = v.union(
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly")
);
export type AggregationPeriod = Infer<typeof aggregationPeriodValidator>;

// ============================================================================
// COMPOSITE VALIDATORS (for function arguments)
// ============================================================================

/** Terminal input for creation */
export const terminalInputValidator = v.object({
  name: v.string(),
  code: v.string(),
  address: v.optional(v.string()),
  timezone: v.string(),
  defaultSlotCapacity: v.number(),
  autoValidationThreshold: v.number(),
  capacityAlertThresholds: v.array(v.number()),
  operatingHoursStart: v.string(),
  operatingHoursEnd: v.string(),
});

/** Gate input for creation */
export const gateInputValidator = v.object({
  terminalId: v.id("terminals"),
  name: v.string(),
  code: v.string(),
  description: v.optional(v.string()),
  allowedTruckTypes: v.array(truckTypeValidator),
  allowedTruckClasses: v.array(truckClassValidator),
});

/** Time slot input for creation */
export const timeSlotInputValidator = v.object({
  terminalId: v.id("terminals"),
  date: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  maxCapacity: v.number(),
  autoValidationThreshold: v.optional(v.number()),
});

/** Container input for creation */
export const containerInputValidator = v.object({
  ownerId: v.string(),
  containerNumber: v.string(),
  containerType: containerTypeValidator,
  dimensions: containerDimensionsValidator,
  weightClass: containerWeightClassValidator,
  operationType: containerOperationValidator,
  isEmpty: v.boolean(),
  readyDate: v.optional(v.number()),
  departureDate: v.optional(v.number()),
  notes: v.optional(v.string()),
});

/** Truck input for creation */
export const truckInputValidator = v.object({
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
  terminalId: v.id("terminals"),
  truckId: v.id("trucks"),
  containerIds: v.array(v.id("containers")),
  preferredDate: v.string(),
  preferredTimeStart: v.string(),
  preferredTimeEnd: v.string(),
  driverName: v.optional(v.string()),
  driverPhone: v.optional(v.string()),
  driverIdNumber: v.optional(v.string()),
});

/** User profile input */
export const userProfileInputValidator = v.object({
  preferredLanguage: v.literal("fr"),
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

/** All container types for validation */
export const ALL_CONTAINER_TYPES: ContainerType[] = [
  "dry",
  "reefer",
  "open_top",
  "flat_rack",
  "tank",
  "hazardous",
];

/** All container dimensions for validation */
export const ALL_CONTAINER_DIMENSIONS: ContainerDimensions[] = [
  "20ft",
  "40ft",
  "40ft_hc",
  "45ft",
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

/** Validate ISO 6346 container number */
export function isValidContainerNumber(num: string): boolean {
  // Format: 4 letters (owner) + 6 digits + 1 check digit
  // Example: MSCU1234567
  const regex = /^[A-Z]{4}\d{7}$/;
  return regex.test(num);
}
