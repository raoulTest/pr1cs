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

/** Container type (ISO standard classifications) */
export const containerTypeValidator = v.union(
  v.literal("dry"), // Standard dry container
  v.literal("reefer"), // Refrigerated
  v.literal("open_top"), // Open top
  v.literal("flat_rack"), // Flat rack
  v.literal("tank"), // Tank container
  v.literal("hazardous") // Hazardous materials
);

/** Container dimensions (ISO standard) */
export const containerDimensionsValidator = v.union(
  v.literal("20ft"), // 20' standard
  v.literal("40ft"), // 40' standard
  v.literal("40ft_hc"), // 40' high cube
  v.literal("45ft") // 45' high cube
);

/** Container weight class */
export const containerWeightClassValidator = v.union(
  v.literal("light"), // < 10 tons
  v.literal("medium"), // 10-20 tons
  v.literal("heavy"), // 20-30 tons
  v.literal("super_heavy") // > 30 tons
);

/** Container operation type */
export const containerOperationValidator = v.union(
  v.literal("pick_up"), // Carrier picks up from terminal
  v.literal("drop_off") // Carrier drops off at terminal
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

/** Language preference - French only */
export const languageValidator = v.literal("fr");

/** Booking history change types */
export const bookingChangeTypeValidator = v.union(
  v.literal("created"),
  v.literal("status_changed"),
  v.literal("time_slot_changed"),
  v.literal("truck_changed"),
  v.literal("driver_updated"),
  v.literal("details_updated")
);

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

/** Aggregation period */
export const aggregationPeriodValidator = v.union(
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly")
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
    code: v.string(), // Unique terminal code (e.g., "TER1")
    address: v.optional(v.string()),
    timezone: v.string(), // e.g., "Europe/Paris"
    isActive: v.boolean(),

    // Terminal-wide capacity settings
    defaultSlotCapacity: v.number(), // Default trucks per slot
    autoValidationThreshold: v.number(), // 0-100 (percentage for auto-approval)

    // Capacity alert thresholds
    capacityAlertThresholds: v.array(v.number()), // e.g., [70, 85, 95]

    // Operating hours (slots are always 1 hour)
    operatingHoursStart: v.string(), // e.g., "00:00"
    operatingHoursEnd: v.string(), // e.g., "23:00"

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID (stored as string)
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  /**
   * Gates - Entry points at terminals
   * Created by: port_admin or terminal_operator
   * Note: Capacity is now at terminal level, gates are just for assignment
   */
  gates: defineTable({
    terminalId: v.id("terminals"),
    name: v.string(),
    code: v.string(), // e.g., "GATE-A1"
    description: v.optional(v.string()),
    isActive: v.boolean(),
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
   * TimeSlots - Bookable time windows per terminal
   * Note: Slot records are ONLY created when a booking is made for that slot.
   * Virtual slots (no bookings yet) are computed from terminal operating hours.
   */
  timeSlots: defineTable({
    // Terminal-level, not gate-level
    terminalId: v.id("terminals"),
    // Date as YYYY-MM-DD string for easy indexing
    date: v.string(),
    startTime: v.string(), // HH:mm format (24h)
    endTime: v.string(), // HH:mm format (24h)
    // Terminal capacity (truck count) - inherited from terminal.defaultSlotCapacity
    maxCapacity: v.number(),
    currentBookings: v.number(), // Confirmed + pending count
    // Auto-validation threshold for this slot (override terminal default)
    autoValidationThreshold: v.optional(v.number()), // 0-100%, null = use terminal default
    // Slot can be disabled by operator
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(), // Better Auth user ID
  })
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_date", ["terminalId", "date"])
    .index("by_date", ["date"])
    .index("by_terminal_and_active", ["terminalId", "isActive"]),

  /**
   * SlotTemplates - Weekly recurring slot capacity templates
   * 168 rows per terminal (7 days × 24 hours)
   * Created automatically when terminal is created
   */
  slotTemplates: defineTable({
    terminalId: v.id("terminals"),
    dayOfWeek: v.number(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    hour: v.number(), // 0-23
    maxCapacity: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_day", ["terminalId", "dayOfWeek"])
    .index("by_terminal_day_hour", ["terminalId", "dayOfWeek", "hour"]),

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
  // CONTAINERS (Pre-seeded, assigned to carriers)
  // --------------------------------------------------------------------------

  /**
   * Containers - Pre-seeded containers assigned to carriers
   * Simulates external data source for demo purposes
   */
  containers: defineTable({
    // Ownership - Direct to carrier user (no company)
    ownerId: v.string(), // Better Auth user ID (carrier role)

    // ISO 6346 container identification
    containerNumber: v.string(), // e.g., "MSCU1234567"

    // Classification
    containerType: containerTypeValidator,
    dimensions: containerDimensionsValidator,
    weightClass: containerWeightClassValidator,

    // Operation details
    operationType: containerOperationValidator,

    // For pick_up: when container will be ready for collection
    readyDate: v.optional(v.number()),
    // For drop_off: expected departure date from terminal
    departureDate: v.optional(v.number()),

    // State
    isEmpty: v.boolean(), // Empty vs loaded
    isActive: v.boolean(), // Soft delete flag

    // Booking association (undefined if not booked)
    bookingId: v.optional(v.id("bookings")),

    // Metadata
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_active", ["ownerId", "isActive"])
    .index("by_container_number", ["containerNumber"])
    .index("by_operation", ["operationType"])
    .index("by_booking", ["bookingId"])
    .index("by_type", ["containerType"])
    .index("by_owner_and_operation", ["ownerId", "operationType"]),

  // --------------------------------------------------------------------------
  // TRUCKS (Owned directly by carrier users)
  // --------------------------------------------------------------------------

  /**
   * Trucks - Vehicles owned directly by carrier users
   * Note: Changed from carrierCompanyId to ownerId
   */
  trucks: defineTable({
    // Direct ownership by carrier user (no company)
    ownerId: v.string(), // Better Auth user ID (carrier role)

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
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_active", ["ownerId", "isActive"])
    .index("by_license_plate", ["licensePlate"])
    .index("by_type", ["truckType"])
    .index("by_class", ["truckClass"]),

  // --------------------------------------------------------------------------
  // BOOKINGS
  // --------------------------------------------------------------------------

  /**
   * Bookings - Truck time slot reservations with multiple containers
   * Terminal-level capacity, gate assigned at approval
   */
  bookings: defineTable({
    // Terminal-level (gate assigned later at confirmation)
    terminalId: v.id("terminals"),
    carrierId: v.string(), // Better Auth user ID (carrier role)
    truckId: v.id("trucks"),

    // Gate assigned at approval, not booking
    gateId: v.optional(v.id("gates")),

    // Multiple containers per booking
    containerIds: v.array(v.id("containers")),

    // Reference (terminal-prefixed)
    bookingReference: v.string(), // e.g., "TER1-BK-001234"
    status: bookingStatusValidator,

    // Auto-validation tracking
    wasAutoValidated: v.boolean(),

    // Preferred slot (before gate assignment)
    preferredDate: v.string(), // YYYY-MM-DD
    preferredTimeStart: v.string(), // HH:mm
    preferredTimeEnd: v.string(), // HH:mm

    // QR scan timestamps
    entryScannedAt: v.optional(v.number()),
    exitScannedAt: v.optional(v.number()),
    scannedByEntry: v.optional(v.string()), // Operator who scanned entry
    scannedByExit: v.optional(v.string()), // Operator who scanned exit

    // QR code
    qrCode: v.optional(v.string()), // Data URL
    qrCodeStorageId: v.optional(v.id("_storage")), // Convex file storage

    // Driver info
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverIdNumber: v.optional(v.string()),

    // Timestamps
    bookedAt: v.number(),
    confirmedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    consumedAt: v.optional(v.number()),
    expiredAt: v.optional(v.number()),

    // Status metadata
    statusReason: v.optional(v.string()),
    processedBy: v.optional(v.string()), // Who processed this booking

    createdBy: v.string(), // Better Auth user ID
    updatedAt: v.number(),
  })
    .index("by_reference", ["bookingReference"])
    .index("by_carrier", ["carrierId"])
    .index("by_carrier_and_status", ["carrierId", "status"])
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_status", ["terminalId", "status"])
    .index("by_terminal_and_date", ["terminalId", "preferredDate"])
    .index("by_gate", ["gateId"])
    .index("by_truck", ["truckId"])
    .index("by_status", ["status"])
    .index("by_date", ["preferredDate"])
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
   * French only (as per requirements)
   */
  notifications: defineTable({
    // Recipient
    userId: v.string(), // Better Auth user ID
    // Notification type and content
    type: notificationTypeValidator,
    channel: notificationChannelValidator,
    // Content (French only)
    title: v.string(),
    body: v.string(),
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
  // AUDIT LOGS
  // --------------------------------------------------------------------------

  /**
   * AuditLogs - Full audit trail for all actions
   */
  auditLogs: defineTable({
    // Who
    userId: v.optional(v.string()), // null for anonymous/failed auth

    // What
    action: auditActionValidator,
    resource: v.string(), // e.g., "bookings.create"
    resourceId: v.optional(v.string()), // Document ID if applicable

    // Details
    args: v.optional(v.string()), // JSON string (sanitized, no secrets)
    result: v.optional(v.string()), // "success", "error:CODE", etc.
    errorMessage: v.optional(v.string()),

    // Context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),

    // AI-specific
    aiThreadId: v.optional(v.string()),
    aiToolName: v.optional(v.string()),

    // Timing
    timestamp: v.number(),
    durationMs: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_and_action", ["userId", "action"])
    .index("by_ai_thread", ["aiThreadId"]),

  // --------------------------------------------------------------------------
  // BOOKING AGGREGATES (Analytics)
  // --------------------------------------------------------------------------

  /**
   * BookingAggregates - Pre-computed analytics data
   */
  bookingAggregates: defineTable({
    // Scope
    terminalId: v.id("terminals"),
    period: aggregationPeriodValidator,
    date: v.string(), // YYYY-MM-DD
    hour: v.optional(v.number()), // 0-23 for hourly aggregates

    // Booking counts by status
    totalBookings: v.number(),
    pendingCount: v.number(),
    confirmedCount: v.number(),
    rejectedCount: v.number(),
    consumedCount: v.number(),
    cancelledCount: v.number(),
    expiredCount: v.number(),
    autoValidatedCount: v.number(),

    // Capacity metrics
    avgUtilizationPercent: v.number(),
    peakUtilizationPercent: v.number(),

    // Container metrics
    totalContainers: v.number(),
    pickupCount: v.number(),
    dropoffCount: v.number(),

    // Timing metrics (milliseconds)
    avgWaitTimeMs: v.optional(v.number()), // Time from booking to confirm
    avgProcessingTimeMs: v.optional(v.number()), // Time in terminal

    computedAt: v.number(),
  })
    .index("by_terminal", ["terminalId"])
    .index("by_terminal_and_period", ["terminalId", "period"])
    .index("by_terminal_and_date", ["terminalId", "date"])
    .index("by_date", ["date"]),

  // --------------------------------------------------------------------------
  // SYSTEM CONFIGURATION
  // --------------------------------------------------------------------------

  /**
   * SystemConfig - Global system settings
   * Singleton table (should have only one document)
   */
  systemConfig: defineTable({
    // Booking window
    maxAdvanceBookingDays: v.number(), // e.g., 30
    minAdvanceBookingHours: v.number(), // e.g., 2

    // No-show handling
    noShowGracePeriodMinutes: v.number(), // e.g., 30

    // Auto-validation defaults
    defaultAutoValidationThreshold: v.number(), // 0-100, global default

    // Reminder settings
    reminderHoursBefore: v.array(v.number()), // e.g., [24, 2]

    // Container settings
    maxContainersPerBooking: v.number(), // e.g., 10

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
    // User preferences (French only, but keep field for future)
    preferredLanguage: v.literal("fr"), // Always French
    notificationChannel: notificationChannelValidator,
    // Phone for future SMS notifications
    phone: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
