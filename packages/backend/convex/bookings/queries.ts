/**
 * Booking Queries
 * Read operations for booking data with role-based access control
 * 
 * Updated for new schema:
 * - Terminal-level bookings (not gate-level)
 * - carrierId instead of carrierCompanyId
 * - containerIds array instead of single containerNumber
 * - gateId is optional (assigned at confirmation)
 * - Time info directly on booking (preferredDate/preferredTimeStart/preferredTimeEnd)
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
import {
  bookingStatusValidator,
  containerTypeValidator,
  containerDimensionsValidator,
  containerOperationValidator,
} from "../lib/validators";
import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

// ============================================================================
// RETURN TYPE VALIDATORS
// ============================================================================

const containerSummaryValidator = v.object({
  _id: v.id("containers"),
  containerNumber: v.string(),
  containerType: containerTypeValidator,
  dimensions: containerDimensionsValidator,
  operationType: containerOperationValidator,
  isEmpty: v.boolean(),
});

const bookingListItemValidator = v.object({
  _id: v.id("bookings"),
  _creationTime: v.number(),
  bookingReference: v.string(),
  status: bookingStatusValidator,
  wasAutoValidated: v.boolean(),
  // Time info (directly on booking)
  preferredDate: v.string(),
  preferredTimeStart: v.string(),
  preferredTimeEnd: v.string(),
  // Terminal/Gate info
  terminalId: v.id("terminals"),
  terminalName: v.string(),
  gateId: v.optional(v.id("gates")),
  gateName: v.optional(v.string()),
  // Truck info
  truckId: v.id("trucks"),
  licensePlate: v.string(),
  // Carrier info
  carrierId: v.string(),
  // Container count
  containerCount: v.number(),
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
  wasAutoValidated: v.boolean(),
  qrCode: v.optional(v.string()),
  // Time info
  preferredDate: v.string(),
  preferredTimeStart: v.string(),
  preferredTimeEnd: v.string(),
  // Terminal/Gate info
  terminalId: v.id("terminals"),
  terminalName: v.string(),
  terminalCode: v.string(),
  gateId: v.optional(v.id("gates")),
  gateName: v.optional(v.string()),
  gateCode: v.optional(v.string()),
  // Truck info
  truckId: v.id("trucks"),
  licensePlate: v.string(),
  truckType: v.string(),
  truckClass: v.string(),
  // Carrier info
  carrierId: v.string(),
  // Container info
  containers: v.array(containerSummaryValidator),
  // Driver info
  driverName: v.optional(v.string()),
  driverPhone: v.optional(v.string()),
  driverIdNumber: v.optional(v.string()),
  // Status details
  statusReason: v.optional(v.string()),
  processedBy: v.optional(v.string()),
  // QR scan timestamps
  entryScannedAt: v.optional(v.number()),
  exitScannedAt: v.optional(v.number()),
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
    const [terminal, gate, truck] = await Promise.all([
      ctx.db.get(booking.terminalId),
      booking.gateId ? ctx.db.get(booking.gateId) : null,
      ctx.db.get(booking.truckId),
    ]);

    // Fetch containers
    const containers = await Promise.all(
      booking.containerIds.map((id) => ctx.db.get(id))
    );
    const validContainers = containers.filter((c): c is Doc<"containers"> => c !== null);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      wasAutoValidated: booking.wasAutoValidated,
      qrCode: booking.qrCode,
      // Time info
      preferredDate: booking.preferredDate,
      preferredTimeStart: booking.preferredTimeStart,
      preferredTimeEnd: booking.preferredTimeEnd,
      // Terminal/Gate
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Inconnu",
      terminalCode: terminal?.code ?? "",
      gateId: booking.gateId,
      gateName: gate?.name,
      gateCode: gate?.code,
      // Truck
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Inconnu",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      // Carrier
      carrierId: booking.carrierId,
      // Containers
      containers: validContainers.map((c) => ({
        _id: c._id,
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
      processedBy: booking.processedBy,
      // QR scan
      entryScannedAt: booking.entryScannedAt,
      exitScannedAt: booking.exitScannedAt,
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
    const [terminal, gate, truck] = await Promise.all([
      ctx.db.get(booking.terminalId),
      booking.gateId ? ctx.db.get(booking.gateId) : null,
      ctx.db.get(booking.truckId),
    ]);

    // Fetch containers
    const containers = await Promise.all(
      booking.containerIds.map((id) => ctx.db.get(id))
    );
    const validContainers = containers.filter((c): c is Doc<"containers"> => c !== null);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      wasAutoValidated: booking.wasAutoValidated,
      qrCode: booking.qrCode,
      preferredDate: booking.preferredDate,
      preferredTimeStart: booking.preferredTimeStart,
      preferredTimeEnd: booking.preferredTimeEnd,
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Inconnu",
      terminalCode: terminal?.code ?? "",
      gateId: booking.gateId,
      gateName: gate?.name,
      gateCode: gate?.code,
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Inconnu",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      carrierId: booking.carrierId,
      containers: validContainers.map((c) => ({
        _id: c._id,
        containerNumber: c.containerNumber,
        containerType: c.containerType,
        dimensions: c.dimensions,
        operationType: c.operationType,
        isEmpty: c.isEmpty,
      })),
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverIdNumber: booking.driverIdNumber,
      statusReason: booking.statusReason,
      processedBy: booking.processedBy,
      entryScannedAt: booking.entryScannedAt,
      exitScannedAt: booking.exitScannedAt,
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
 * List bookings for the current user (carrier)
 */
export const listMyBookings = query({
  args: {
    status: v.optional(bookingStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user)) {
      return [];
    }

    const limit = args.limit ?? 50;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q) =>
          q.eq("carrierId", user.userId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) => q.eq("carrierId", user.userId))
        .order("desc");
    }

    const bookings = await bookingsQuery.take(limit);

    return await enrichBookingList(ctx, bookings);
  },
});

/**
 * List bookings for a specific carrier (port admin)
 */
export const listByCarrier = query({
  args: {
    carrierId: v.string(),
    status: v.optional(bookingStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Only port admins can query any carrier's bookings
    if (!isPortAdmin(user)) {
      // Carriers can only see their own
      if (!isCarrier(user) || user.userId !== args.carrierId) {
        return [];
      }
    }

    const limit = args.limit ?? 50;

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q) =>
          q.eq("carrierId", args.carrierId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) => q.eq("carrierId", args.carrierId))
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
    } else if (args.date) {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", args.terminalId).eq("preferredDate", args.date!)
        )
        .order("desc");
    } else {
      bookingsQuery = ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q) => q.eq("terminalId", args.terminalId))
        .order("desc");
    }

    let bookings = await bookingsQuery.take(limit * 2); // Fetch more to allow filtering

    // Additional date filter if status was specified
    if (args.date && args.status) {
      bookings = bookings.filter((b) => b.preferredDate === args.date);
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

    // Note: Gate is assigned at confirmation, so we filter bookings with this gate
    let bookingsQuery = ctx.db
      .query("bookings")
      .withIndex("by_gate", (q) => q.eq("gateId", args.gateId))
      .order("desc");

    let bookings = await bookingsQuery.take(limit * 2);

    // Filter by status if provided
    if (args.status) {
      bookings = bookings.filter((b) => b.status === args.status);
    }

    // Filter by date if provided
    if (args.date) {
      bookings = bookings.filter((b) => b.preferredDate === args.date);
    }

    return await enrichBookingList(ctx, bookings.slice(0, limit));
  },
});

/**
 * List bookings for a specific date (terminal operators)
 */
export const listByDate = query({
  args: {
    date: v.string(), // YYYY-MM-DD
    terminalId: v.optional(v.id("terminals")),
    status: v.optional(bookingStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(bookingListItemValidator),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return [];
    }

    const limit = args.limit ?? 100;

    let bookings: Doc<"bookings">[] = [];

    if (args.terminalId) {
      const canAccess = await canManageTerminal(ctx, user, args.terminalId);
      if (!canAccess) return [];

      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal_and_date", (q) =>
          q.eq("terminalId", args.terminalId!).eq("preferredDate", args.date)
        )
        .order("desc")
        .take(limit * 2);
    } else {
      // Query by date across all terminals user can access
      const terminalIds = await getManagedTerminalIds(ctx, user);

      for (const terminalId of terminalIds) {
        const terminalBookings = await ctx.db
          .query("bookings")
          .withIndex("by_terminal_and_date", (q) =>
            q.eq("terminalId", terminalId).eq("preferredDate", args.date)
          )
          .take(limit);
        bookings.push(...terminalBookings);
      }
    }

    // Filter by status if provided
    if (args.status) {
      bookings = bookings.filter((b) => b.status === args.status);
    }

    // Sort and limit
    bookings.sort((a, b) => b._creationTime - a._creationTime);
    bookings = bookings.slice(0, limit);

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
    carrierId: v.optional(v.string()),
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
    } else if (args.carrierId) {
      // Carrier-specific counts
      if (!isPortAdmin(user)) {
        if (!isCarrier(user) || user.userId !== args.carrierId) {
          return counts;
        }
      }

      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) => q.eq("carrierId", args.carrierId!))
        .collect();
    } else if (isCarrier(user)) {
      // Default for carrier: their own bookings
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q) => q.eq("carrierId", user.userId))
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
    wasAutoValidated: boolean;
    preferredDate: string;
    preferredTimeStart: string;
    preferredTimeEnd: string;
    terminalId: Id<"terminals">;
    terminalName: string;
    gateId?: Id<"gates">;
    gateName?: string;
    truckId: Id<"trucks">;
    licensePlate: string;
    carrierId: string;
    containerCount: number;
    driverName?: string;
    bookedAt: number;
    confirmedAt?: number;
  }[]
> {
  // Collect all unique IDs
  const terminalIds = [...new Set(bookings.map((b) => b.terminalId))];
  const gateIds = [...new Set(bookings.filter((b) => b.gateId).map((b) => b.gateId!))] as Id<"gates">[];
  const truckIds = [...new Set(bookings.map((b) => b.truckId))];

  // Batch fetch all related data
  const [terminals, gates, trucks] = await Promise.all([
    Promise.all(terminalIds.map((id) => ctx.db.get(id))),
    Promise.all(gateIds.map((id) => ctx.db.get(id))),
    Promise.all(truckIds.map((id) => ctx.db.get(id))),
  ]);

  // Create lookup maps
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

  // Map bookings with enriched data
  return bookings.map((booking) => {
    const terminal = terminalMap.get(booking.terminalId);
    const gate = booking.gateId ? gateMap.get(booking.gateId) : undefined;
    const truck = truckMap.get(booking.truckId);

    return {
      _id: booking._id,
      _creationTime: booking._creationTime,
      bookingReference: booking.bookingReference,
      status: booking.status,
      wasAutoValidated: booking.wasAutoValidated,
      preferredDate: booking.preferredDate,
      preferredTimeStart: booking.preferredTimeStart,
      preferredTimeEnd: booking.preferredTimeEnd,
      terminalId: booking.terminalId,
      terminalName: terminal?.name ?? "Inconnu",
      gateId: booking.gateId,
      gateName: gate?.name,
      truckId: booking.truckId,
      licensePlate: truck?.licensePlate ?? "Inconnu",
      carrierId: booking.carrierId,
      containerCount: booking.containerIds.length,
      driverName: booking.driverName,
      bookedAt: booking.bookedAt,
      confirmedAt: booking.confirmedAt,
    };
  });
}
