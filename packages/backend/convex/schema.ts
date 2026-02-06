import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// SHARED VALIDATORS (exported for reuse in functions)
// ============================================================================

/** APCS user roles */
export const apcsRoleValidator = v.union(
  v.literal("port_admin"),
  v.literal("terminal_operator"),
  v.literal("carrier")
);

/** Booking status lifecycle */
export const bookingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("rejected"),
  v.literal("consumed"),
  v.literal("cancelled"),
  v.literal("expired")
);

/** Truck size/weight class */
export const truckClassValidator = v.union(
  v.literal("light"), // < 3.5t
  v.literal("medium"), // 3.5t - 7.5t
  v.literal("heavy"), // 7.5t - 18t
  v.literal("super_heavy") // > 18t
);

/** Truck type */
export const truckTypeValidator = v.union(
  v.literal("container"),
  v.literal("flatbed"),
  v.literal("tanker"),
  v.literal("refrigerated"),
  v.literal("bulk"),
  v.literal("general")
);

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

/** Notification channel */
export const notificationChannelValidator = v.union(
  v.literal("in_app"),
  v.literal("email"),
  v.literal("both")
);

/** Language preference */
export const languageValidator = v.union(v.literal("en"), v.literal("fr"));

/** Booking history change types */
export const bookingChangeTypeValidator = v.union(
  v.literal("created"),
  v.literal("status_changed"),
  v.literal("time_slot_changed"),
  v.literal("truck_changed"),
  v.literal("driver_updated"),
  v.literal("details_updated")
);

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

export default defineSchema({
  // --------------------------------------------------------------------------
  // TERMINALS & GATES
  // --------------------------------------------------------------------------

  /**
   * Terminals - Physical port terminals
   * Created by: port_admin
   */
  terminals: defineTable({
    name: v.string(),
    code: v.string(), // Unique terminal code (e.g., "TRM-001")
    address: v.optional(v.string()),
    timezone: v.string(), // e.g., "America/New_York"
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID (stored as string)
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  /**
   * Gates - Entry points at terminals with capacity
   * Created by: port_admin or terminal_operator
   */
  gates: defineTable({
    terminalId: v.id("terminals"),
    name: v.string(),
    code: v.string(), // e.g., "GATE-A1"
    description: v.optional(v.string()),
    isActive: v.boolean(),
    // Default capacity (can be overridden per time slot)
    defaultCapacity: v.number(),
    // Allowed truck types at this gate
    allowedTruckTypes: v.array(truckTypeValidator),
    // Allowed truck classes at this gate
    allowedTruckClasses: v.array(truckClassValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID
  })
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_active", ["terminalId", "isActive"])
    .index("by_code", ["code"]),

  /**
   * TimeSlots - Bookable time windows per gate
   * Non-overlapping within the same gate
   */
  timeSlots: defineTable({
    gateId: v.id("gates"),
    // Date as YYYY-MM-DD string for easy indexing
    date: v.string(),
    startTime: v.string(), // HH:mm format (24h)
    endTime: v.string(), // HH:mm format (24h)
    // Max trucks allowed in this slot (overrides gate default if set)
    maxCapacity: v.number(),
    // Calculated field - updated on booking changes
    currentBookings: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID
  })
    .index("by_gate", ["gateId"])
    .index("by_gate_and_date", ["gateId", "date"])
    .index("by_date", ["date"])
    .index("by_gate_and_active", ["gateId", "isActive"]),

  // --------------------------------------------------------------------------
  // TERMINAL OPERATOR ASSIGNMENTS (Many-to-Many)
  // --------------------------------------------------------------------------

  /**
   * TerminalOperatorAssignments - Links operators to terminals
   * An operator can manage multiple terminals
   */
  terminalOperatorAssignments: defineTable({
    userId: v.string(), // Better Auth user ID (with terminal_operator role)
    terminalId: v.id("terminals"),
    assignedAt: v.number(),
    assignedBy: v.string(), // port_admin who made the assignment
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"])
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_active", ["terminalId", "isActive"])
    .index("by_user_and_terminal", ["userId", "terminalId"]),

  // --------------------------------------------------------------------------
  // CARRIER COMPANIES & TRUCKS
  // --------------------------------------------------------------------------

  /**
   * CarrierCompanies - Organizations that own trucks
   * Created by: port_admin or self-registered
   */
  carrierCompanies: defineTable({
    name: v.string(),
    code: v.string(), // Unique company code
    taxId: v.optional(v.string()), // Business registration number
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    // Notification preferences
    preferredLanguage: languageValidator,
    notificationChannel: notificationChannelValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_name", ["name"]),

  /**
   * CarrierUsers - Links Better Auth users to carrier companies
   * A user with 'carrier' role belongs to exactly one company
   */
  carrierUsers: defineTable({
    userId: v.string(), // Better Auth user ID
    carrierCompanyId: v.id("carrierCompanies"),
    isCompanyAdmin: v.boolean(), // Can manage company's trucks/bookings
    joinedAt: v.number(),
    invitedBy: v.optional(v.string()), // Optional for self-registered founders
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["carrierCompanyId"])
    .index("by_company_and_active", ["carrierCompanyId", "isActive"]),

  /**
   * Trucks - Vehicles owned by carrier companies
   */
  trucks: defineTable({
    carrierCompanyId: v.id("carrierCompanies"),
    licensePlate: v.string(),
    // Truck classification
    truckType: truckTypeValidator,
    truckClass: truckClassValidator,
    // Additional info
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    // Capacity in tons
    maxWeight: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID
  })
    .index("by_carrier", ["carrierCompanyId"])
    .index("by_carrier_and_active", ["carrierCompanyId", "isActive"])
    .index("by_license_plate", ["licensePlate"])
    .index("by_type", ["truckType"])
    .index("by_class", ["truckClass"]),

  // --------------------------------------------------------------------------
  // BOOKINGS
  // --------------------------------------------------------------------------

  /**
   * Bookings - Truck time slot reservations
   * Full lifecycle: pending -> confirmed/rejected -> consumed/cancelled/expired
   */
  bookings: defineTable({
    // References
    timeSlotId: v.id("timeSlots"),
    truckId: v.id("trucks"),
    carrierCompanyId: v.id("carrierCompanies"),
    // Denormalized for efficient queries
    gateId: v.id("gates"),
    terminalId: v.id("terminals"),
    // Booking details
    bookingReference: v.string(), // Human-readable reference (e.g., "BK-20240115-001")
    status: bookingStatusValidator,
    // QR code data (stored as data URL or external URL)
    qrCode: v.optional(v.string()),
    // Driver info (optional, can be added later)
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverIdNumber: v.optional(v.string()),
    // Container/cargo info
    containerNumber: v.optional(v.string()),
    cargoDescription: v.optional(v.string()),
    // Timestamps
    bookedAt: v.number(),
    confirmedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    consumedAt: v.optional(v.number()),
    // Rejection/cancellation reason
    statusReason: v.optional(v.string()),
    // Who processed this booking (operator who confirmed/rejected)
    processedBy: v.optional(v.string()), // Better Auth user ID
    // Booking creator
    createdBy: v.string(), // Better Auth user ID
    updatedAt: v.number(),
  })
    .index("by_reference", ["bookingReference"])
    .index("by_time_slot", ["timeSlotId"])
    .index("by_time_slot_and_status", ["timeSlotId", "status"])
    .index("by_truck", ["truckId"])
    .index("by_carrier", ["carrierCompanyId"])
    .index("by_carrier_and_status", ["carrierCompanyId", "status"])
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_status", ["terminalId", "status"])
    .index("by_gate", ["gateId"])
    .index("by_gate_and_status", ["gateId", "status"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  /**
   * BookingHistory - Audit trail for all booking changes
   * Immutable log of all modifications
   */
  bookingHistory: defineTable({
    bookingId: v.id("bookings"),
    // What changed
    changeType: bookingChangeTypeValidator,
    // Previous and new values (JSON strings for flexibility)
    previousValue: v.optional(v.string()),
    newValue: v.string(),
    // Change metadata
    changedAt: v.number(),
    changedBy: v.string(), // Better Auth user ID
    // Optional note explaining the change
    note: v.optional(v.string()),
    // For capacity-affecting changes, track if rebook was required
    requiredRebook: v.boolean(),
  })
    .index("by_booking", ["bookingId"])
    .index("by_booking_and_type", ["bookingId", "changeType"])
    .index("by_changed_by", ["changedBy"])
    .index("by_changed_at", ["changedAt"]),

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------

  /**
   * Notifications - In-app and email notifications
   * Bilingual support (EN/FR)
   */
  notifications: defineTable({
    // Recipient
    userId: v.string(), // Better Auth user ID
    // Notification type and content
    type: notificationTypeValidator,
    channel: notificationChannelValidator,
    // Content (bilingual)
    titleEn: v.string(),
    titleFr: v.string(),
    bodyEn: v.string(),
    bodyFr: v.string(),
    // Related entity (for deep linking)
    relatedEntityType: v.optional(
      v.union(
        v.literal("booking"),
        v.literal("terminal"),
        v.literal("time_slot")
      )
    ),
    relatedEntityId: v.optional(v.string()),
    // Status
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    // Email status (if channel includes email)
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),
    emailError: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_created_at", ["createdAt"]),

  // --------------------------------------------------------------------------
  // SYSTEM CONFIGURATION
  // --------------------------------------------------------------------------

  /**
   * SystemConfig - Global system settings
   * Singleton table (should have only one document)
   */
  systemConfig: defineTable({
    // Cancellation policy (-1 or 0 = disabled)
    cancellationWindowHours: v.number(),
    // Booking settings
    maxAdvanceBookingDays: v.number(), // How far in advance can book
    minAdvanceBookingHours: v.number(), // Minimum hours before slot
    // Reminder settings
    reminderHoursBefore: v.array(v.number()), // e.g., [24, 2] for 24h and 2h reminders
    // Last updated
    updatedAt: v.number(),
    updatedBy: v.string(), // Better Auth user ID
  }),

  // --------------------------------------------------------------------------
  // USER PROFILE EXTENSION
  // --------------------------------------------------------------------------

  /**
   * UserProfiles - Extended user data beyond Better Auth
   * One-to-one with Better Auth user table
   */
  userProfiles: defineTable({
    userId: v.string(), // Better Auth user ID
    // APCS role (separate from Better Auth's admin/user role)
    apcsRole: v.optional(apcsRoleValidator),
    // User preferences
    preferredLanguage: languageValidator,
    notificationChannel: notificationChannelValidator,
    // Phone for future SMS notifications
    phone: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["apcsRole"]),
});
