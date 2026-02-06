/**
 * Booking Queries
 * Read operations for booking data with role-based access control
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  isPortAdmin,
  isTerminalOperator,
  isCarrier,
  canViewBooking,
  canManageTerminal,
  getManagedTerminalIds,
} from "../lib/permissions";
import { bookingStatusValidator } from "../lib/validators";
import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

// ============================================================================
// RETURN TYPE VALIDATORS
// ============================================================================

const bookingListItemValidator = v.object({
  _id: v.id("bookings"),
  _creationTime: v.number(),
  bookingReference: v.string(),
  status: bookingStatusValidator,
  // Time slot info
  timeSlotId: v.id("timeSlots"),
  date: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  // Terminal/Gate info
  terminalId: v.id("terminals"),
  terminalName: v.string(),
  gateId: v.id("gates"),
  gateName: v.string(),
  // Truck info
  truckId: v.id("trucks"),
  licensePlate: v.string(),
  // Carrier info
  carrierCompanyId: v.id("carrierCompanies"),
  carrierCompanyName: v.string(),
  // Driver info
  driverName: v.optional(v.string()),
  // Timestamps
  bookedAt: v.number(),
  confirmedAt: v.optional(v.number()),
});

const bookingDetailValidator = v.object({
  _id: v.id("bookings"),
  _creationTime: v.number(),
  bookingReference: v.string(),
  status: bookingStatusValidator,
  qrCode: v.optional(v.string()),
  // Time slot info
  timeSlotId: v.id("timeSlots"),
  date: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  // Terminal/Gate info
  terminalId: v.id("terminals"),
  terminalName: v.string(),
  terminalCode: v.string(),
  gateId: v.id("gates"),
  gateName: v.string(),
  gateCode: v.string(),
  // Truck info
  truckId: v.id("trucks"),
  licensePlate: v.string(),
  truckType: v.string(),
  truckClass: v.string(),
  // Carrier info
  carrierCompanyId: v.id("carrierCompanies"),
  carrierCompanyName: v.string(),
  carrierCompanyCode: v.string(),
  // Driver info
  driverName: v.optional(v.string()),
  driverPhone: v.optional(v.string()),
  driverIdNumber: v.optional(v.string()),
  // Cargo info
  containerNumber: v.optional(v.string()),
  cargoDescription: v.optional(v.string()),
  // Status details
  statusReason: v.optional(v.string()),
  processedBy: v.optional(v.string()),
  // Timestamps
  bookedAt: v.number(),
  confirmedAt: v.optional(v.number()),
  rejectedAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  consumedAt: v.optional(v.number()),
  updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single booking by ID with full details
 */
export const get = query({
  args: { bookingId: v.id("bookings") },
  returns: v.union(bookingDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    // Check permission
    const canView = await canViewBooking(ctx, user, args.bookingId);
    if (!canView) return null;

    // Fetch related data
    const [timeSlot, terminal, gate, truck, carrier] = await Promise.all([
      ctx.db.get(booking.timeSlotId),
      ctx.db.get(booking.terminalId),
      ctx.db.get(booking.gateId),
      ctx.db.get(booking.truckId),
      ctx.db.get(booking.carrierCompanyId),
    ]);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      qrCode: booking.qrCode,
      // Time slot
      timeSlotId: booking.timeSlotId,
      date: timeSlot?.date ?? "",
      startTime: timeSlot?.startTime ?? "",
      endTime: timeSlot?.endTime ?? "",
      // Terminal/Gate
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Unknown",
      terminalCode: terminal?.code ?? "",
      gateId: booking.gateId,
      gateName: gate?.name ?? "Unknown",
      gateCode: gate?.code ?? "",
      // Truck
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Unknown",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      // Carrier
      carrierCompanyId: booking.carrierCompanyId,
      carrierCompanyName: carrier?.name ?? "Unknown",
      carrierCompanyCode: carrier?.code ?? "",
      // Driver
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverIdNumber: booking.driverIdNumber,
      // Cargo
      containerNumber: booking.containerNumber,
      cargoDescription: booking.cargoDescription,
      // Status
      statusReason: booking.statusReason,
      processedBy: booking.processedBy,
      // Timestamps
      bookedAt: booking.bookedAt,
      confirmedAt: booking.confirmedAt,
      rejectedAt: booking.rejectedAt,
      cancelledAt: booking.cancelledAt,
      consumedAt: booking.consumedAt,
      updatedAt: booking.updatedAt,
    };
  },
});

/**
 * Get a booking by reference number
 */
export const getByReference = query({
  args: { bookingReference: v.string() },
  returns: v.union(bookingDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) =>
        q.eq("bookingReference", args.bookingReference.toUpperCase().trim())
      )
      .unique();

    if (!booking) return null;

    // Check permission
    const canView = await canViewBooking(ctx, user, booking._id);
    if (!canView) return null;

    // Fetch related data
    const [timeSlot, terminal, gate, truck, carrier] = await Promise.all([
      ctx.db.get(booking.timeSlotId),
      ctx.db.get(booking.terminalId),
      ctx.db.get(booking.gateId),
      ctx.db.get(booking.truckId),
      ctx.db.get(booking.carrierCompanyId),
    ]);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      qrCode: booking.qrCode,
      timeSlotId: booking.timeSlotId,
      date: timeSlot?.date ?? "",
      startTime: timeSlot?.startTime ?? "",
      endTime: timeSlot?.endTime ?? "",
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Unknown",
      terminalCode: terminal?.code ?? "",
      gateId: booking.gateId,
      gateName: gate?.name ?? "Unknown",
      gateCode: gate?.code ?? "",
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Unknown",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      carrierCompanyId: booking.carrierCompanyId,
      carrierCompanyName: carrier?.name ?? "Unknown",
      carrierCompanyCode: carrier?.code ?? "",
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverIdNumber: booking.driverIdNumber,
      containerNumber: booking.containerNumber,
      cargoDescription: booking.cargoDescription,
      statusReason: booking.statusReason,
      processedBy: booking.processedBy,
      bookedAt: booking.bookedAt,
      confirmedAt: booking.confirmedAt,
      rejectedAt: booking.rejectedAt,
      cancelledAt: booking.cancelledAt,
      consumedAt: booking.consumedAt,
      updatedAt: booking.updatedAt,
    };
  },
});

/**
 * List bookings for the current user's carrier company
 */
export const listMyBookings = query({
  args: {
    status: v.optional(bookingStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user) || !user.carrierCompanyId) {
      return [];
    }

    const limit = args.limit ?? 50;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q) =>
          q.eq("carrierCompanyId", user.carrierCompanyId!).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", user.carrierCompanyId!)
        )
        .order("desc");
    }

    const bookings = await bookingsQuery.take(limit);

    return await enrichBookingList(ctx, bookings);
  },
});

/**
 * List bookings for a specific carrier company (port admin)
 */
export const listByCarrier = query({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
    status: v.optional(bookingStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Only port admins can query any carrier's bookings
    if (!isPortAdmin(user)) {
      // Carriers can only see their own
      if (!isCarrier(user) || user.carrierCompanyId !== args.carrierCompanyId) {
        return [];
      }
    }

    const limit = args.limit ?? 50;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId)
        )
        .order("desc");
    }

    const bookings = await bookingsQuery.take(limit);

    return await enrichBookingList(ctx, bookings);
  },
});

/**
 * List bookings for a specific terminal (terminal operators and admins)
 */
export const listByTerminal = query({
  args: {
    terminalId: v.id("terminals"),
    status: v.optional(bookingStatusValidator),
    date: v.optional(v.string()), // YYYY-MM-DD
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check access to terminal
    const canAccess = await canManageTerminal(ctx, user, args.terminalId);
    if (!canAccess) {
      return [];
    }

    const limit = args.limit ?? 100;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_status", (q) =>
          q.eq("terminalId", args.terminalId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
        .order("desc");
    }

    let bookings = await bookingsQuery.take(limit * 2); // Fetch more to allow filtering

    // Filter by date if provided
    if (args.date) {
      const timeSlotIds = new Set<Id<"timeSlots">>();
      const slotsForDate = await ctx.db
        .query("timeSlots")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .collect();
      slotsForDate.forEach((s) => timeSlotIds.add(s._id));

      bookings = bookings.filter((b) => timeSlotIds.has(b.timeSlotId));
    }

    return await enrichBookingList(ctx, bookings.slice(0, limit));
  },
});

/**
 * List bookings for a specific gate
 */
export const listByGate = query({
  args: {
    gateId: v.id("gates"),
    status: v.optional(bookingStatusValidator),
    date: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get gate to check terminal access
    const gate = await ctx.db.get(args.gateId);
    if (!gate) return [];

    const canAccess = await canManageTerminal(ctx, user, gate.terminalId);
    if (!canAccess) {
      return [];
    }

    const limit = args.limit ?? 100;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_gate_and_status", (q) =>
          q.eq("gateId", args.gateId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_gate", (q) => q.eq("gateId", args.gateId))
        .order("desc");
    }

    let bookings = await bookingsQuery.take(limit * 2);

    // Filter by date if provided
    if (args.date) {
      const timeSlotIds = new Set<Id<"timeSlots">>();
      const slotsForDate = await ctx.db
        .query("timeSlots")
        .withIndex("by_gate_and_date", (q) =>
          q.eq("gateId", args.gateId).eq("date", args.date!)
        )
        .collect();
      slotsForDate.forEach((s) => timeSlotIds.add(s._id));

      bookings = bookings.filter((b) => timeSlotIds.has(b.timeSlotId));
    }

    return await enrichBookingList(ctx, bookings.slice(0, limit));
  },
});

/**
 * List bookings for a specific time slot
 */
export const listByTimeSlot = query({
  args: {
    timeSlotId: v.id("timeSlots"),
    status: v.optional(bookingStatusValidator),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get time slot to check terminal access
    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) return [];

    const gate = await ctx.db.get(timeSlot.gateId);
    if (!gate) return [];

    const canAccess = await canManageTerminal(ctx, user, gate.terminalId);
    if (!canAccess && !isCarrier(user)) {
      return [];
    }

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_time_slot_and_status", (q) =>
          q.eq("timeSlotId", args.timeSlotId).eq("status", args.status!)
        );
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId));
    }

    let bookings = await bookingsQuery.collect();

    // For carriers, filter to only their own bookings
    if (isCarrier(user) && user.carrierCompanyId) {
      bookings = bookings.filter(
        (b) => b.carrierCompanyId === user.carrierCompanyId
      );
    }

    return await enrichBookingList(ctx, bookings);
  },
});

/**
 * List pending bookings requiring action (for terminal operators)
 */
export const listPendingForOperator = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return [];
    }

    const limit = args.limit ?? 50;

    // Get terminals the user can manage
    let terminalIds: Id<"terminals">[];
    if (args.terminalId) {
      const canAccess = await canManageTerminal(ctx, user, args.terminalId);
      if (!canAccess) return [];
      terminalIds = [args.terminalId];
    } else {
      terminalIds = await getManagedTerminalIds(ctx, user);
    }

    // Collect pending bookings from all managed terminals
    const allBookings: Doc<"bookings">[] = [];

    for (const terminalId of terminalIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_status", (q) =>
          q.eq("terminalId", terminalId).eq("status", "pending")
        )
        .order("asc") // Oldest first for FIFO processing
        .take(limit);

      allBookings.push(...bookings);
    }

    // Sort by creation time and take limit
    allBookings.sort((a, b) => a._creationTime - b._creationTime);
    const limitedBookings = allBookings.slice(0, limit);

    return await enrichBookingList(ctx, limitedBookings);
  },
});

/**
 * Count bookings by status for dashboard
 */
export const countByStatus = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
    carrierCompanyId: v.optional(v.id("carrierCompanies")),
  },
  returns: v.object({
    pending: v.number(),
    confirmed: v.number(),
    rejected: v.number(),
    consumed: v.number(),
    cancelled: v.number(),
    expired: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const counts = {
      pending: 0,
      confirmed: 0,
      rejected: 0,
      consumed: 0,
      cancelled: 0,
      expired: 0,
      total: 0,
    };

    let bookings: Doc<"bookings">[];

    if (args.terminalId) {
      // Terminal-specific counts
      const canAccess = await canManageTerminal(ctx, user, args.terminalId);
      if (!canAccess) return counts;

      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId!))
        .collect();
    } else if (args.carrierCompanyId) {
      // Carrier-specific counts
      if (!isPortAdmin(user)) {
        if (!isCarrier(user) || user.carrierCompanyId !== args.carrierCompanyId) {
          return counts;
        }
      }

      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId!)
        )
        .collect();
    } else if (isCarrier(user) && user.carrierCompanyId) {
      // Default for carrier: their own bookings
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) =>
          q.eq("carrierCompanyId", user.carrierCompanyId!)
        )
        .collect();
    } else if (isPortAdmin(user)) {
      // Admin: all bookings (might be slow for large datasets)
      bookings = await ctx.db.query("bookings").collect();
    } else if (isTerminalOperator(user)) {
      // Operator: bookings for managed terminals
      const terminalIds = await getManagedTerminalIds(ctx, user);
      bookings = [];
      for (const terminalId of terminalIds) {
        const terminalBookings = await ctx.db
          .query("bookings")
          .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId))
          .collect();
        bookings.push(...terminalBookings);
      }
    } else {
      return counts;
    }

    // Count by status
    for (const booking of bookings) {
      counts[booking.status]++;
      counts.total++;
    }

    return counts;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich a list of bookings with related data
 */
async function enrichBookingList(
  ctx: QueryCtx,
  bookings: Doc<"bookings">[]
): Promise<
  {
    _id: Id<"bookings">;
    _creationTime: number;
    bookingReference: string;
    status: Doc<"bookings">["status"];
    timeSlotId: Id<"timeSlots">;
    date: string;
    startTime: string;
    endTime: string;
    terminalId: Id<"terminals">;
    terminalName: string;
    gateId: Id<"gates">;
    gateName: string;
    truckId: Id<"trucks">;
    licensePlate: string;
    carrierCompanyId: Id<"carrierCompanies">;
    carrierCompanyName: string;
    driverName?: string;
    bookedAt: number;
    confirmedAt?: number;
  }[]
> {
  // Collect all unique IDs
  const timeSlotIds = [...new Set(bookings.map((b) => b.timeSlotId))];
  const terminalIds = [...new Set(bookings.map((b) => b.terminalId))];
  const gateIds = [...new Set(bookings.map((b) => b.gateId))];
  const truckIds = [...new Set(bookings.map((b) => b.truckId))];
  const carrierIds = [...new Set(bookings.map((b) => b.carrierCompanyId))];

  // Batch fetch all related data
  const [timeSlots, terminals, gates, trucks, carriers] = await Promise.all([
    Promise.all(timeSlotIds.map((id) => ctx.db.get(id))),
    Promise.all(terminalIds.map((id) => ctx.db.get(id))),
    Promise.all(gateIds.map((id) => ctx.db.get(id))),
    Promise.all(truckIds.map((id) => ctx.db.get(id))),
    Promise.all(carrierIds.map((id) => ctx.db.get(id))),
  ]);

  // Create lookup maps
  const timeSlotMap = new Map<Id<"timeSlots">, Doc<"timeSlots">>();
  for (const slot of timeSlots) {
    if (slot) timeSlotMap.set(slot._id, slot);
  }

  const terminalMap = new Map<Id<"terminals">, Doc<"terminals">>();
  for (const terminal of terminals) {
    if (terminal) terminalMap.set(terminal._id, terminal);
  }

  const gateMap = new Map<Id<"gates">, Doc<"gates">>();
  for (const gate of gates) {
    if (gate) gateMap.set(gate._id, gate);
  }

  const truckMap = new Map<Id<"trucks">, Doc<"trucks">>();
  for (const truck of trucks) {
    if (truck) truckMap.set(truck._id, truck);
  }

  const carrierMap = new Map<Id<"carrierCompanies">, Doc<"carrierCompanies">>();
  for (const carrier of carriers) {
    if (carrier) carrierMap.set(carrier._id, carrier);
  }

  // Map bookings with enriched data
  return bookings.map((booking) => {
    const timeSlot = timeSlotMap.get(booking.timeSlotId);
    const terminal = terminalMap.get(booking.terminalId);
    const gate = gateMap.get(booking.gateId);
    const truck = truckMap.get(booking.truckId);
    const carrier = carrierMap.get(booking.carrierCompanyId);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      timeSlotId: booking.timeSlotId,
      date: timeSlot?.date ?? "",
      startTime: timeSlot?.startTime ?? "",
      endTime: timeSlot?.endTime ?? "",
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Unknown",
      gateId: booking.gateId,
      gateName: gate?.name ?? "Unknown",
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Unknown",
      carrierCompanyId: booking.carrierCompanyId,
      carrierCompanyName: carrier?.name ?? "Unknown",
      driverName: booking.driverName,
      bookedAt: booking.bookedAt,
      confirmedAt: booking.confirmedAt,
    };
  });
}
