/**
 * Internal Queries for AI Tools
 *
 * These are internal queries called by the agent tools.
 * They bypass the normal auth middleware because the agent action
 * already authenticated the user and passes userId explicitly.
 *
 * IMPORTANT: All data access respects RBAC - the userId is used to
 * look up the user's role and filter data accordingly.
 *
 * Updated for new schema:
 * - No carrierCompanies/carrierUsers tables
 * - Bookings use carrierId (string), not carrierCompanyId
 * - Bookings have preferredDate/preferredTimeStart/preferredTimeEnd (not timeSlotId)
 * - Bookings have containerIds array (not containerNumber)
 * - gateId is optional on bookings
 * - Time slots are terminal-level (by_terminal_and_date index)
 */
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id, Doc, DataModel } from "../_generated/dataModel";
import { authComponent } from "../auth";
import type { GenericCtx } from "@convex-dev/better-auth";

// ============================================================================
// HELPERS
// ============================================================================

async function getUserProfile(ctx: { db: any }, userId: string) {
  return ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
}

/**
 * Get user role from Better Auth user record
 */
async function getUserRoleHelper(ctx: { db: any }, userId: string): Promise<string | null> {
  // Use authComponent to query Better Auth user table properly
  const authUser = await authComponent.getAnyUserById(
    ctx as unknown as GenericCtx<DataModel>,
    userId
  );
  if (!authUser) return null;
  
  // Role is on the authUser object (cast needed due to Better Auth typing)
  return (authUser as unknown as { role: string }).role ?? null;
}

/**
 * Enrich bookings with related data for AI responses
 * Updated for new schema: no timeSlotId, no carrierCompanyId
 */
async function enrichBookings(
  ctx: { db: any },
  bookings: Doc<"bookings">[],
): Promise<
  Array<{
    bookingReference: string;
    status: string;
    date: string;
    startTime: string;
    endTime: string;
    terminalName: string;
    terminalCode: string;
    gateName: string | null;
    gateCode: string | null;
    licensePlate: string;
    containerCount: number;
    containerNumbers: string[];
    driverName?: string;
    bookedAt: number;
    confirmedAt?: number;
    wasAutoValidated: boolean;
  }>
> {
  // Batch fetch all related data
  const terminalIds = [...new Set(bookings.map((b) => b.terminalId))];
  const gateIds = [...new Set(bookings.filter(b => b.gateId).map((b) => b.gateId!))];
  const truckIds = [...new Set(bookings.map((b) => b.truckId))];

  const [terminals, gates, trucks] = await Promise.all([
    Promise.all(terminalIds.map((id) => ctx.db.get(id))),
    Promise.all(gateIds.map((id) => ctx.db.get(id))),
    Promise.all(truckIds.map((id) => ctx.db.get(id))),
  ]);

  const termMap = new Map(
    terminals.filter(Boolean).map((t: any) => [t._id, t]),
  );
  const gateMap = new Map(gates.filter(Boolean).map((g: any) => [g._id, g]));
  const truckMap = new Map(
    trucks.filter(Boolean).map((t: any) => [t._id, t]),
  );

  // Fetch containers for all bookings
  const allContainerIds = bookings.flatMap(b => b.containerIds || []);
  const containers = await Promise.all(allContainerIds.map(id => ctx.db.get(id)));
  const containerMap = new Map(
    containers.filter(Boolean).map((c: any) => [c._id, c]),
  );

  return bookings.map((b) => {
    const terminal = termMap.get(b.terminalId) as any;
    const gate = b.gateId ? gateMap.get(b.gateId) as any : null;
    const truck = truckMap.get(b.truckId) as any;
    
    const bookingContainers = (b.containerIds || [])
      .map(id => containerMap.get(id))
      .filter(Boolean);

    return {
      bookingReference: b.bookingReference,
      status: b.status,
      date: b.preferredDate,
      startTime: b.preferredTimeStart,
      endTime: b.preferredTimeEnd,
      terminalName: terminal?.name ?? "Inconnu",
      terminalCode: terminal?.code ?? "",
      gateName: gate?.name ?? null,
      gateCode: gate?.code ?? null,
      licensePlate: truck?.licensePlate ?? "Inconnu",
      containerCount: bookingContainers.length,
      containerNumbers: bookingContainers.map((c: any) => c.containerNumber),
      driverName: b.driverName,
      bookedAt: b.bookedAt,
      confirmedAt: b.confirmedAt,
      wasAutoValidated: b.wasAutoValidated ?? false,
    };
  });
}

// ============================================================================
// BOOKING QUERIES
// ============================================================================

export const listMyBookings = internalQuery({
  args: {
    userId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // In new schema, carriers own bookings directly via carrierId
    const limit = args.limit ?? 20;
    let bookings: Doc<"bookings">[];

    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q: any) =>
          q.eq("carrierId", args.userId).eq("status", args.status),
        )
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q: any) =>
          q.eq("carrierId", args.userId),
        )
        .order("desc")
        .take(limit);
    }

    return enrichBookings(ctx, bookings);
  },
});

export const getBookingByReference = internalQuery({
  args: {
    userId: v.string(),
    bookingReference: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q: any) =>
        q.eq("bookingReference", args.bookingReference.toUpperCase().trim()),
      )
      .unique();

    if (!booking) return null;

    // Check access - get user role
    const role = await getUserRoleHelper(ctx, args.userId);
    if (!role) return null;

    // Carriers can only see their own bookings
    if (role === "carrier" && booking.carrierId !== args.userId) {
      return null;
    }

    // Fetch all related data
    const [terminal, gate, truck] = await Promise.all([
      ctx.db.get(booking.terminalId),
      booking.gateId ? ctx.db.get(booking.gateId) : null,
      ctx.db.get(booking.truckId),
    ]);

    // Fetch containers
    const containers = await Promise.all(
      (booking.containerIds || []).map((id: Id<"containers">) => ctx.db.get(id))
    );
    const validContainers = containers.filter(Boolean);

    return {
      bookingReference: booking.bookingReference,
      status: booking.status,
      qrCode: booking.qrCode,
      wasAutoValidated: booking.wasAutoValidated ?? false,
      // Time info (from booking directly, not timeSlot)
      date: booking.preferredDate,
      startTime: booking.preferredTimeStart,
      endTime: booking.preferredTimeEnd,
      // Terminal / Gate
      terminalName: terminal?.name ?? "Inconnu",
      terminalCode: terminal?.code ?? "",
      gateName: gate?.name ?? null,
      gateCode: gate?.code ?? null,
      // Truck
      licensePlate: truck?.licensePlate ?? "Inconnu",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      // Containers (new schema)
      containerCount: validContainers.length,
      containers: validContainers.map((c: any) => ({
        containerNumber: c.containerNumber,
        containerType: c.containerType,
        dimensions: c.dimensions,
        operationType: c.operationType,
        isEmpty: c.isEmpty,
      })),
      // Driver
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverIdNumber: booking.driverIdNumber,
      // Status
      statusReason: booking.statusReason,
      // Timestamps
      bookedAt: booking.bookedAt,
      confirmedAt: booking.confirmedAt,
      rejectedAt: booking.rejectedAt,
      cancelledAt: booking.cancelledAt,
      consumedAt: booking.consumedAt,
    };
  },
});

export const listBookingsByTerminal = internalQuery({
  args: {
    userId: v.string(),
    terminalCode: v.string(),
    status: v.optional(v.string()),
    date: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const role = await getUserRoleHelper(ctx, args.userId);
    if (!role || !["port_admin", "terminal_operator"].includes(role)) {
      return [];
    }

    // Find terminal by code
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();
    if (!terminal) return [];

    // Check operator assignment
    if (role === "terminal_operator") {
      const assignment = await ctx.db
        .query("terminalOperatorAssignments")
        .withIndex("by_user_and_terminal", (q: any) =>
          q.eq("userId", args.userId).eq("terminalId", terminal._id),
        )
        .unique();
      if (!assignment?.isActive) return [];
    }

    const limit = args.limit ?? 50;
    let bookings: Doc<"bookings">[];

    // If date is provided, use by_terminal_and_date index
    if (args.date) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_date", (q: any) =>
          q.eq("terminalId", terminal._id).eq("preferredDate", args.date),
        )
        .order("desc")
        .take(limit);
      
      // Filter by status if provided
      if (args.status) {
        bookings = bookings.filter(b => b.status === args.status);
      }
    } else if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_status", (q: any) =>
          q.eq("terminalId", terminal._id).eq("status", args.status),
        )
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q: any) =>
          q.eq("terminalId", terminal._id),
        )
        .order("desc")
        .take(limit);
    }

    return enrichBookings(ctx, bookings);
  },
});

export const listBookingsByCarrier = internalQuery({
  args: {
    userId: v.string(),
    carrierId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const role = await getUserRoleHelper(ctx, args.userId);
    if (role !== "port_admin") return [];

    const limit = args.limit ?? 50;
    let bookings: Doc<"bookings">[];

    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q: any) =>
          q.eq("carrierId", args.carrierId).eq("status", args.status),
        )
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q: any) =>
          q.eq("carrierId", args.carrierId),
        )
        .order("desc")
        .take(limit);
    }

    return enrichBookings(ctx, bookings);
  },
});

export const listPendingBookings = internalQuery({
  args: {
    userId: v.string(),
    terminalCode: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const role = await getUserRoleHelper(ctx, args.userId);
    if (!role || !["port_admin", "terminal_operator"].includes(role)) {
      return [];
    }

    const limit = args.limit ?? 50;

    // Determine which terminal IDs to query
    let terminalIds: Id<"terminals">[] = [];

    if (args.terminalCode) {
      const terminal = await ctx.db
        .query("terminals")
        .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
        .unique();
      if (!terminal) return [];
      terminalIds = [terminal._id];
    } else if (role === "port_admin") {
      const allTerminals = await ctx.db.query("terminals").collect();
      terminalIds = allTerminals.map((t: any) => t._id);
    } else {
      const assignments = await ctx.db
        .query("terminalOperatorAssignments")
        .withIndex("by_user_and_active", (q: any) =>
          q.eq("userId", args.userId).eq("isActive", true),
        )
        .collect();
      terminalIds = assignments.map((a: any) => a.terminalId);
    }

    // Collect pending bookings from all terminals
    const allBookings: Doc<"bookings">[] = [];
    for (const terminalId of terminalIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_status", (q: any) =>
          q.eq("terminalId", terminalId).eq("status", "pending"),
        )
        .order("asc")
        .take(limit);
      allBookings.push(...bookings);
    }

    // Sort by creation time and limit
    allBookings.sort((a, b) => a._creationTime - b._creationTime);
    return enrichBookings(ctx, allBookings.slice(0, limit));
  },
});

// ============================================================================
// TERMINAL QUERIES
// ============================================================================

export const listTerminals = internalQuery({
  args: {
    userId: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const activeOnly = args.activeOnly ?? true;
    let terminals;

    if (activeOnly) {
      terminals = await ctx.db
        .query("terminals")
        .withIndex("by_active", (q: any) => q.eq("isActive", true))
        .collect();
    } else {
      terminals = await ctx.db.query("terminals").collect();
    }

    return Promise.all(
      terminals.map(async (t: any) => {
        const gates = await ctx.db
          .query("gates")
          .withIndex("by_terminal_and_active", (q: any) =>
            q.eq("terminalId", t._id).eq("isActive", true),
          )
          .collect();

        return {
          name: t.name,
          code: t.code,
          address: t.address ?? null,
          timezone: t.timezone,
          isActive: t.isActive,
          gateCount: gates.length,
          defaultSlotCapacity: t.defaultSlotCapacity,
          autoValidationThreshold: t.autoValidationThreshold,
          operatingHoursStart: t.operatingHoursStart,
          operatingHoursEnd: t.operatingHoursEnd,
        };
      }),
    );
  },
});

export const getTerminalDetails = internalQuery({
  args: {
    terminalCode: v.string(),
  },
  handler: async (ctx, args) => {
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();
    if (!terminal) return null;

    const gates = await ctx.db
      .query("gates")
      .withIndex("by_terminal", (q: any) =>
        q.eq("terminalId", terminal._id),
      )
      .collect();

    return {
      name: terminal.name,
      code: terminal.code,
      address: terminal.address ?? null,
      timezone: terminal.timezone,
      isActive: terminal.isActive,
      // Terminal-level capacity settings
      defaultSlotCapacity: terminal.defaultSlotCapacity,
      autoValidationThreshold: terminal.autoValidationThreshold,
      operatingHoursStart: terminal.operatingHoursStart,
      operatingHoursEnd: terminal.operatingHoursEnd,
      gates: gates.map((g: any) => ({
        name: g.name,
        code: g.code,
        description: g.description ?? null,
        isActive: g.isActive,
        allowedTruckTypes: g.allowedTruckTypes,
        allowedTruckClasses: g.allowedTruckClasses,
      })),
      gateCount: gates.filter((g: any) => g.isActive).length,
    };
  },
});

export const getAvailableSlots = internalQuery({
  args: {
    terminalCode: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();
    if (!terminal) return null;

    // Get existing slot records for this terminal and date
    const existingSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_terminal_and_date", (q: any) =>
        q.eq("terminalId", terminal._id).eq("date", args.date),
      )
      .collect();

    // Build map of existing slots by startTime
    const slotMap = new Map(existingSlots.map((s: any) => [s.startTime, s]));

    // Generate all possible slots based on terminal operating hours (1-hour slots)
    const slots: Array<{
      startTime: string;
      endTime: string;
      maxCapacity: number;
      currentBookings: number;
      remainingCapacity: number;
      isAvailable: boolean;
      autoValidationRemaining: number;
    }> = [];

    const startHour = parseInt(terminal.operatingHoursStart?.split(":")[0] ?? "0", 10);
    const endHour = parseInt(terminal.operatingHoursEnd?.split(":")[0] ?? "23", 10);

    for (let hour = startHour; hour <= endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

      const existingSlot = slotMap.get(startTime);

      if (existingSlot && existingSlot.isActive) {
        // Real slot with bookings
        const maxAutoValidated = Math.floor(
          (existingSlot.maxCapacity * (existingSlot.autoValidationThreshold ?? terminal.autoValidationThreshold)) / 100
        );
        
        // Count auto-validated bookings for this slot
        const autoValidatedBookings = await ctx.db
          .query("bookings")
          .withIndex("by_terminal_and_date", (q: any) =>
            q.eq("terminalId", terminal._id).eq("preferredDate", args.date)
          )
          .filter((q: any) =>
            q.and(
              q.eq(q.field("preferredTimeStart"), startTime),
              q.eq(q.field("wasAutoValidated"), true),
              q.or(
                q.eq(q.field("status"), "confirmed"),
                q.eq(q.field("status"), "consumed")
              )
            )
          )
          .collect();

        slots.push({
          startTime,
          endTime,
          maxCapacity: existingSlot.maxCapacity,
          currentBookings: existingSlot.currentBookings,
          remainingCapacity: existingSlot.maxCapacity - existingSlot.currentBookings,
          isAvailable: existingSlot.currentBookings < existingSlot.maxCapacity,
          autoValidationRemaining: Math.max(0, maxAutoValidated - autoValidatedBookings.length),
        });
      } else if (!existingSlot) {
        // Virtual slot (no bookings yet)
        const maxAutoValidated = Math.floor(
          (terminal.defaultSlotCapacity * terminal.autoValidationThreshold) / 100
        );

        slots.push({
          startTime,
          endTime,
          maxCapacity: terminal.defaultSlotCapacity,
          currentBookings: 0,
          remainingCapacity: terminal.defaultSlotCapacity,
          isAvailable: true,
          autoValidationRemaining: maxAutoValidated,
        });
      }
    }

    return {
      terminalName: terminal.name,
      terminalCode: terminal.code,
      date: args.date,
      slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      totalCapacity: terminal.defaultSlotCapacity * slots.length,
    };
  },
});

// ============================================================================
// USER QUERIES
// ============================================================================

export const getUserRole = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const role = await getUserRoleHelper(ctx, args.userId);
    return { role };
  },
});

// ============================================================================
// CONFIG QUERIES
// ============================================================================

export const getSystemConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("systemConfig").first();
    if (!config) return null;

    return {
      // Removed: cancellationWindowHours (carriers can cancel anytime)
      maxAdvanceBookingDays: config.maxAdvanceBookingDays,
      minAdvanceBookingHours: config.minAdvanceBookingHours,
      noShowGracePeriodMinutes: config.noShowGracePeriodMinutes,
      defaultAutoValidationThreshold: config.defaultAutoValidationThreshold,
      reminderHoursBefore: config.reminderHoursBefore,
      maxContainersPerBooking: config.maxContainersPerBooking,
    };
  },
});

// ============================================================================
// CONTAINER QUERIES (New)
// ============================================================================

export const listMyContainers = internalQuery({
  args: {
    userId: v.string(),
    operationType: v.optional(v.string()),
    availableOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let containers = await ctx.db
      .query("containers")
      .withIndex("by_owner_and_active", (q: any) =>
        q.eq("ownerId", args.userId).eq("isActive", true)
      )
      .collect();

    // Filter by operation type if provided
    if (args.operationType) {
      containers = containers.filter(c => c.operationType === args.operationType);
    }

    // Filter to available only (not in a booking)
    if (args.availableOnly) {
      containers = containers.filter(c => !c.bookingId);
    }

    return containers.slice(0, limit).map(c => ({
      containerNumber: c.containerNumber,
      containerType: c.containerType,
      dimensions: c.dimensions,
      weightClass: c.weightClass,
      operationType: c.operationType,
      isEmpty: c.isEmpty,
      isBooked: !!c.bookingId,
      readyDate: c.readyDate,
      departureDate: c.departureDate,
    }));
  },
});

// ============================================================================
// TRUCK QUERIES (Updated)
// ============================================================================

export const listMyTrucks = internalQuery({
  args: {
    userId: v.string(),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const activeOnly = args.activeOnly ?? true;

    let trucks;
    if (activeOnly) {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner_and_active", (q: any) =>
          q.eq("ownerId", args.userId).eq("isActive", true)
        )
        .take(limit);
    } else {
      trucks = await ctx.db
        .query("trucks")
        .withIndex("by_owner", (q: any) =>
          q.eq("ownerId", args.userId)
        )
        .take(limit);
    }

    return trucks.map((t: any) => ({
      _id: t._id,
      licensePlate: t.licensePlate,
      truckType: t.truckType,
      truckClass: t.truckClass,
      make: t.make,
      model: t.model,
      year: t.year,
      maxWeight: t.maxWeight,
      isActive: t.isActive,
    }));
  },
});

// ============================================================================
// CONTAINER DETAIL QUERY
// ============================================================================

export const getContainerByNumber = internalQuery({
  args: {
    userId: v.string(),
    containerNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const container = await ctx.db
      .query("containers")
      .withIndex("by_container_number", (q: any) =>
        q.eq("containerNumber", args.containerNumber)
      )
      .unique();

    if (!container) return null;

    // Check ownership
    if (container.ownerId !== args.userId) {
      const role = await getUserRoleHelper(ctx, args.userId);
      if (role !== "port_admin") return null;
    }

    // Get booking if assigned
    let bookingInfo = null;
    if (container.bookingId) {
      const booking = await ctx.db.get(container.bookingId);
      if (booking) {
        bookingInfo = {
          bookingReference: booking.bookingReference,
          status: booking.status,
          date: booking.preferredDate,
          startTime: booking.preferredTimeStart,
        };
      }
    }

    return {
      containerNumber: container.containerNumber,
      containerType: container.containerType,
      dimensions: container.dimensions,
      weightClass: container.weightClass,
      operationType: container.operationType,
      isEmpty: container.isEmpty,
      isActive: container.isActive,
      readyDate: container.readyDate,
      departureDate: container.departureDate,
      notes: container.notes,
      booking: bookingInfo,
    };
  },
});

// ============================================================================
// SLOT SUGGESTION QUERY
// ============================================================================

export const suggestOptimalSlots = internalQuery({
  args: {
    userId: v.string(),
    terminalCode: v.string(),
    containerNumbers: v.optional(v.array(v.string())),
    preferredDate: v.optional(v.string()),
    daysToCheck: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find terminal
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();

    if (!terminal) {
      return { error: "Terminal introuvable" };
    }

    const daysToCheck = args.daysToCheck ?? 3;
    const today = args.preferredDate ?? new Date().toISOString().slice(0, 10);
    
    // Calculate urgency from containers (departure date as timestamp)
    let urgencyTimestamp: number | null = null;
    if (args.containerNumbers && args.containerNumbers.length > 0) {
      for (const num of args.containerNumbers) {
        const container = await ctx.db
          .query("containers")
          .withIndex("by_container_number", (q: any) => q.eq("containerNumber", num))
          .unique();
        if (container?.departureDate) {
          if (!urgencyTimestamp || container.departureDate < urgencyTimestamp) {
            urgencyTimestamp = container.departureDate;
          }
        }
      }
    }
    
    // Convert to date string for comparison
    const urgencyDate = urgencyTimestamp 
      ? new Date(urgencyTimestamp).toISOString().slice(0, 10) 
      : null;

    const suggestions: Array<{
      date: string;
      startTime: string;
      endTime: string;
      availableCapacity: number;
      utilizationPercent: number;
      autoValidationRemaining: number;
      score: number;
      reason: string;
    }> = [];

    // Check each day
    for (let d = 0; d < daysToCheck; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + d);
      const dateStr = checkDate.toISOString().slice(0, 10);

      // Get day of week for template lookup
      const dayOfWeek = checkDate.getDay();

      // Get slot templates for this day
      const templates = await ctx.db
        .query("slotTemplates")
        .withIndex("by_terminal_and_day", (q: any) =>
          q.eq("terminalId", terminal._id).eq("dayOfWeek", dayOfWeek)
        )
        .collect();

      // Get existing slots for this date
      const existingSlots = await ctx.db
        .query("timeSlots")
        .withIndex("by_terminal_and_date", (q: any) =>
          q.eq("terminalId", terminal._id).eq("date", dateStr)
        )
        .collect();

      const slotMap = new Map(existingSlots.map((s: any) => [s.startTime, s]));

      for (const template of templates) {
        if (!template.isActive) continue;

        const startTime = `${template.hour.toString().padStart(2, "0")}:00`;
        const endTime = `${(template.hour + 1).toString().padStart(2, "0")}:00`;

        const existingSlot = slotMap.get(startTime);
        const currentBookings = existingSlot?.currentBookings ?? 0;
        const maxCapacity = existingSlot?.maxCapacity ?? template.maxCapacity;
        const availableCapacity = maxCapacity - currentBookings;

        if (availableCapacity <= 0) continue;

        const utilizationPercent = Math.round((currentBookings / maxCapacity) * 100);
        
        // Calculate auto-validation remaining
        const threshold = terminal.autoValidationThreshold ?? 50;
        const maxAutoValidated = Math.floor((maxCapacity * threshold) / 100);
        const autoValidationRemaining = Math.max(0, maxAutoValidated - currentBookings);

        // Score calculation: lower utilization = higher score
        // Also boost score for urgency matching
        let score = 100 - utilizationPercent;
        
        // Boost for auto-validation availability
        if (autoValidationRemaining > 0) {
          score += 20;
        }

        // Boost for urgency (if date is before departure)
        if (urgencyDate && dateStr <= urgencyDate) {
          score += 15;
        }

        let reason = `${availableCapacity} places disponibles`;
        if (autoValidationRemaining > 0) {
          reason += ", validation automatique possible";
        }
        if (utilizationPercent < 30) {
          reason += ", faible affluence";
        }

        suggestions.push({
          date: dateStr,
          startTime,
          endTime,
          availableCapacity,
          utilizationPercent,
          autoValidationRemaining,
          score,
          reason,
        });
      }
    }

    // Sort by score (descending) and take top 5
    suggestions.sort((a, b) => b.score - a.score);
    const top5 = suggestions.slice(0, 5);

    return {
      terminal: {
        name: terminal.name,
        code: terminal.code,
      },
      urgencyDate,
      suggestions: top5,
    };
  },
});
