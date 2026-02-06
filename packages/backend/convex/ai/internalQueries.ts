/**
 * Internal Queries for AI Tools
 *
 * These are internal queries called by the agent tools.
 * They bypass the normal auth middleware because the agent action
 * already authenticated the user and passes userId explicitly.
 *
 * IMPORTANT: All data access respects RBAC — the userId is used to
 * look up the user's role and filter data accordingly.
 */
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "../_generated/dataModel";

// ============================================================================
// HELPERS
// ============================================================================

async function getUserProfile(ctx: { db: any }, userId: string) {
  return ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
}

async function getCarrierUser(ctx: { db: any }, userId: string) {
  return ctx.db
    .query("carrierUsers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
}

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
    gateName: string;
    gateCode: string;
    licensePlate: string;
    carrierCompanyName: string;
    driverName?: string;
    bookedAt: number;
    confirmedAt?: number;
  }>
> {
  // Batch fetch all related data
  const timeSlotIds = [...new Set(bookings.map((b) => b.timeSlotId))];
  const terminalIds = [...new Set(bookings.map((b) => b.terminalId))];
  const gateIds = [...new Set(bookings.map((b) => b.gateId))];
  const truckIds = [...new Set(bookings.map((b) => b.truckId))];
  const carrierIds = [...new Set(bookings.map((b) => b.carrierCompanyId))];

  const [timeSlots, terminals, gates, trucks, carriers] = await Promise.all([
    Promise.all(timeSlotIds.map((id) => ctx.db.get(id))),
    Promise.all(terminalIds.map((id) => ctx.db.get(id))),
    Promise.all(gateIds.map((id) => ctx.db.get(id))),
    Promise.all(truckIds.map((id) => ctx.db.get(id))),
    Promise.all(carrierIds.map((id) => ctx.db.get(id))),
  ]);

  const slotMap = new Map(
    timeSlots.filter(Boolean).map((s: any) => [s._id, s]),
  );
  const termMap = new Map(
    terminals.filter(Boolean).map((t: any) => [t._id, t]),
  );
  const gateMap = new Map(gates.filter(Boolean).map((g: any) => [g._id, g]));
  const truckMap = new Map(
    trucks.filter(Boolean).map((t: any) => [t._id, t]),
  );
  const carrierMap = new Map(
    carriers.filter(Boolean).map((c: any) => [c._id, c]),
  );

  return bookings.map((b) => {
    const slot = slotMap.get(b.timeSlotId) as any;
    const terminal = termMap.get(b.terminalId) as any;
    const gate = gateMap.get(b.gateId) as any;
    const truck = truckMap.get(b.truckId) as any;
    const carrier = carrierMap.get(b.carrierCompanyId) as any;

    return {
      bookingReference: b.bookingReference,
      status: b.status,
      date: slot?.date ?? "",
      startTime: slot?.startTime ?? "",
      endTime: slot?.endTime ?? "",
      terminalName: terminal?.name ?? "Unknown",
      terminalCode: terminal?.code ?? "",
      gateName: gate?.name ?? "Unknown",
      gateCode: gate?.code ?? "",
      licensePlate: truck?.licensePlate ?? "Unknown",
      carrierCompanyName: carrier?.name ?? "Unknown",
      driverName: b.driverName,
      bookedAt: b.bookedAt,
      confirmedAt: b.confirmedAt,
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
    const carrierUser = await getCarrierUser(ctx, args.userId);
    if (!carrierUser?.isActive) return [];

    const limit = args.limit ?? 20;
    let bookings: Doc<"bookings">[];

    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q: any) =>
          q
            .eq("carrierCompanyId", carrierUser.carrierCompanyId)
            .eq("status", args.status),
        )
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q: any) =>
          q.eq("carrierCompanyId", carrierUser.carrierCompanyId),
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

    // Check access
    const profile = await getUserProfile(ctx, args.userId);
    if (!profile?.apcsRole) return null;

    if (profile.apcsRole === "carrier") {
      const carrierUser = await getCarrierUser(ctx, args.userId);
      if (booking.carrierCompanyId !== carrierUser?.carrierCompanyId)
        return null;
    }

    // Fetch all related data
    const [timeSlot, terminal, gate, truck, carrier] = await Promise.all([
      ctx.db.get(booking.timeSlotId),
      ctx.db.get(booking.terminalId),
      ctx.db.get(booking.gateId),
      ctx.db.get(booking.truckId),
      ctx.db.get(booking.carrierCompanyId),
    ]);

    return {
      bookingReference: booking.bookingReference,
      status: booking.status,
      qrCode: booking.qrCode,
      // Time slot
      date: timeSlot?.date ?? "",
      startTime: timeSlot?.startTime ?? "",
      endTime: timeSlot?.endTime ?? "",
      // Terminal / Gate
      terminalName: terminal?.name ?? "Unknown",
      terminalCode: terminal?.code ?? "",
      gateName: gate?.name ?? "Unknown",
      gateCode: gate?.code ?? "",
      // Truck
      licensePlate: truck?.licensePlate ?? "Unknown",
      truckType: truck?.truckType ?? "unknown",
      truckClass: truck?.truckClass ?? "unknown",
      // Carrier
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
    const profile = await getUserProfile(ctx, args.userId);
    if (
      !profile?.apcsRole ||
      !["port_admin", "terminal_operator"].includes(profile.apcsRole)
    )
      return [];

    // Find terminal by code
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();
    if (!terminal) return [];

    // Check operator assignment
    if (profile.apcsRole === "terminal_operator") {
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

    if (args.status) {
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

    // Filter by date if provided
    if (args.date) {
      const slotsForDate = await ctx.db
        .query("timeSlots")
        .withIndex("by_date", (q: any) => q.eq("date", args.date))
        .collect();
      const slotIds = new Set(slotsForDate.map((s: any) => s._id as string));
      bookings = bookings.filter((b) =>
        slotIds.has(b.timeSlotId as unknown as string),
      );
    }

    return enrichBookings(ctx, bookings);
  },
});

export const listBookingsByCarrier = internalQuery({
  args: {
    userId: v.string(),
    carrierCode: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx, args.userId);
    if (profile?.apcsRole !== "port_admin") return [];

    const carrier = await ctx.db
      .query("carrierCompanies")
      .withIndex("by_code", (q: any) => q.eq("code", args.carrierCode))
      .unique();
    if (!carrier) return [];

    const limit = args.limit ?? 50;
    let bookings: Doc<"bookings">[];

    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier_and_status", (q: any) =>
          q.eq("carrierCompanyId", carrier._id).eq("status", args.status),
        )
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_carrier", (q: any) =>
          q.eq("carrierCompanyId", carrier._id),
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
    const profile = await getUserProfile(ctx, args.userId);
    if (
      !profile?.apcsRole ||
      !["port_admin", "terminal_operator"].includes(profile.apcsRole)
    )
      return [];

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
    } else if (profile.apcsRole === "port_admin") {
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
      gates: gates.map((g: any) => ({
        name: g.name,
        code: g.code,
        description: g.description ?? null,
        isActive: g.isActive,
        defaultCapacity: g.defaultCapacity,
        allowedTruckTypes: g.allowedTruckTypes,
        allowedTruckClasses: g.allowedTruckClasses,
      })),
      totalCapacity: gates.reduce(
        (sum: number, g: any) => sum + g.defaultCapacity,
        0,
      ),
    };
  },
});

export const getAvailableSlots = internalQuery({
  args: {
    terminalCode: v.string(),
    gateCode: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const terminal = await ctx.db
      .query("terminals")
      .withIndex("by_code", (q: any) => q.eq("code", args.terminalCode))
      .unique();
    if (!terminal) return null;

    // Get gates (optionally filtered)
    let gates;
    if (args.gateCode) {
      const gate = await ctx.db
        .query("gates")
        .withIndex("by_code", (q: any) => q.eq("code", args.gateCode))
        .unique();
      gates = gate ? [gate] : [];
    } else {
      gates = await ctx.db
        .query("gates")
        .withIndex("by_terminal_and_active", (q: any) =>
          q.eq("terminalId", terminal._id).eq("isActive", true),
        )
        .collect();
    }

    // Get time slots for each gate on the given date
    const results = await Promise.all(
      gates.map(async (gate: any) => {
        const slots = await ctx.db
          .query("timeSlots")
          .withIndex("by_gate_and_date", (q: any) =>
            q.eq("gateId", gate._id).eq("date", args.date),
          )
          .collect();

        return {
          gateName: gate.name,
          gateCode: gate.code,
          allowedTruckTypes: gate.allowedTruckTypes,
          allowedTruckClasses: gate.allowedTruckClasses,
          slots: slots
            .filter((s: any) => s.isActive)
            .map((s: any) => ({
              startTime: s.startTime,
              endTime: s.endTime,
              maxCapacity: s.maxCapacity,
              currentBookings: s.currentBookings,
              remainingCapacity: s.maxCapacity - s.currentBookings,
              isAvailable: s.currentBookings < s.maxCapacity,
            })),
        };
      }),
    );

    return {
      terminalName: terminal.name,
      terminalCode: terminal.code,
      date: args.date,
      gates: results,
    };
  },
});

// ============================================================================
// USER QUERIES
// ============================================================================

export const getUserRole = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx, args.userId);
    if (!profile) return null;
    return { apcsRole: profile.apcsRole ?? null };
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
      cancellationWindowHours: config.cancellationWindowHours,
      maxAdvanceBookingDays: config.maxAdvanceBookingDays,
      minAdvanceBookingHours: config.minAdvanceBookingHours,
      reminderHoursBefore: config.reminderHoursBefore,
    };
  },
});
