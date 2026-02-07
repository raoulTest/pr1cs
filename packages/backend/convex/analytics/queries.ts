/**
 * Analytics Queries
 * Computed analytics from raw booking, container, truck, and time slot data.
 * All queries enforce RBAC - port_admin sees everything, terminal_operator sees their terminals.
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  isPortAdmin,
  isTerminalOperator,
  requireRole,
  getManagedTerminalIds,
  canManageTerminal,
} from "../lib/permissions";
import type { Doc, Id } from "../_generated/dataModel";
import { authComponent } from "../auth";

// ============================================================================
// BOOKING TRENDS (time-series)
// ============================================================================

/**
 * Get booking trends over time, grouped by day.
 * Returns daily counts by status for charting.
 */
export const getBookingTrends = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      total: v.number(),
      pending: v.number(),
      confirmed: v.number(),
      rejected: v.number(),
      cancelled: v.number(),
      consumed: v.number(),
      expired: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return [];
    }

    const days = args.days ?? 30;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Determine which terminals to query
    let terminalIds: Id<"terminals">[];
    if (args.terminalId) {
      const canAccess = await canManageTerminal(ctx, user, args.terminalId);
      if (!canAccess) return [];
      terminalIds = [args.terminalId];
    } else {
      terminalIds = await getManagedTerminalIds(ctx, user);
    }

    // Collect bookings from all relevant terminals
    const allBookings: Doc<"bookings">[] = [];
    for (const terminalId of terminalIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId))
        .collect();
      allBookings.push(...bookings);
    }

    // Filter to date range and group by preferredDate
    const dateMap = new Map<
      string,
      {
        total: number;
        pending: number;
        confirmed: number;
        rejected: number;
        cancelled: number;
        consumed: number;
        expired: number;
      }
    >();

    // Initialize all dates in range
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dateMap.set(dateStr, {
        total: 0,
        pending: 0,
        confirmed: 0,
        rejected: 0,
        cancelled: 0,
        consumed: 0,
        expired: 0,
      });
    }

    for (const booking of allBookings) {
      if (booking.preferredDate < startDateStr) continue;
      const entry = dateMap.get(booking.preferredDate);
      if (entry) {
        entry.total++;
        entry[booking.status]++;
      }
    }

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ============================================================================
// TERMINAL COMPARISON
// ============================================================================

/**
 * Compare booking volumes across terminals.
 * Port admin only.
 */
export const getTerminalComparison = query({
  args: {},
  returns: v.array(
    v.object({
      terminalId: v.id("terminals"),
      terminalName: v.string(),
      terminalCode: v.string(),
      total: v.number(),
      confirmed: v.number(),
      pending: v.number(),
      rejected: v.number(),
    })
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const terminals = await ctx.db.query("terminals").collect();
    const results = [];

    for (const terminal of terminals) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_terminal", (q) => q.eq("terminalId", terminal._id))
        .collect();

      let confirmed = 0;
      let pending = 0;
      let rejected = 0;

      for (const b of bookings) {
        if (b.status === "confirmed" || b.status === "consumed") confirmed++;
        else if (b.status === "pending") pending++;
        else if (b.status === "rejected") rejected++;
      }

      results.push({
        terminalId: terminal._id,
        terminalName: terminal.name,
        terminalCode: terminal.code,
        total: bookings.length,
        confirmed,
        pending,
        rejected,
      });
    }

    return results.sort((a, b) => b.total - a.total);
  },
});

// ============================================================================
// CONTAINER STATS
// ============================================================================

/**
 * Get container breakdown by type, dimensions, and operation.
 */
export const getContainerStats = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
  },
  returns: v.object({
    byType: v.array(
      v.object({
        type: v.string(),
        count: v.number(),
      })
    ),
    byDimensions: v.array(
      v.object({
        dimensions: v.string(),
        count: v.number(),
      })
    ),
    byOperation: v.array(
      v.object({
        operation: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return { byType: [], byDimensions: [], byOperation: [] };
    }

    let containers: Doc<"containers">[];

    if (args.terminalId || isTerminalOperator(user)) {
      // For operators or filtered view: get containers via bookings for that terminal
      let terminalIds: Id<"terminals">[];
      if (args.terminalId) {
        const canAccess = await canManageTerminal(ctx, user, args.terminalId);
        if (!canAccess) return { byType: [], byDimensions: [], byOperation: [] };
        terminalIds = [args.terminalId];
      } else {
        terminalIds = await getManagedTerminalIds(ctx, user);
      }

      // Get bookings for these terminals to find container IDs
      const containerIds = new Set<Id<"containers">>();
      for (const terminalId of terminalIds) {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId))
          .collect();
        for (const b of bookings) {
          for (const cId of b.containerIds) {
            containerIds.add(cId);
          }
        }
      }

      // Fetch the containers
      const containerPromises = Array.from(containerIds).map((id) =>
        ctx.db.get(id)
      );
      containers = (await Promise.all(containerPromises)).filter(
        (c): c is Doc<"containers"> => c !== null
      );
    } else {
      // Port admin without filter: all active containers
      containers = await ctx.db
        .query("containers")
        .collect();
    }

    // Count by type
    const typeCounts = new Map<string, number>();
    const dimCounts = new Map<string, number>();
    const opCounts = new Map<string, number>();

    for (const c of containers) {
      typeCounts.set(c.containerType, (typeCounts.get(c.containerType) ?? 0) + 1);
      dimCounts.set(c.dimensions, (dimCounts.get(c.dimensions) ?? 0) + 1);
      opCounts.set(c.operationType, (opCounts.get(c.operationType) ?? 0) + 1);
    }

    return {
      byType: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      byDimensions: Array.from(dimCounts.entries())
        .map(([dimensions, count]) => ({ dimensions, count }))
        .sort((a, b) => b.count - a.count),
      byOperation: Array.from(opCounts.entries())
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

// ============================================================================
// TRUCK STATS
// ============================================================================

/**
 * Get truck breakdown by type and class.
 * Port admin only.
 */
export const getTruckStats = query({
  args: {},
  returns: v.object({
    byType: v.array(
      v.object({
        type: v.string(),
        count: v.number(),
      })
    ),
    byClass: v.array(
      v.object({
        truckClass: v.string(),
        count: v.number(),
      })
    ),
    byTypeAndClass: v.array(
      v.object({
        type: v.string(),
        light: v.number(),
        medium: v.number(),
        heavy: v.number(),
        super_heavy: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const trucks = await ctx.db.query("trucks").collect();

    // Count by type
    const typeCounts = new Map<string, number>();
    const classCounts = new Map<string, number>();
    const typeClassCounts = new Map<
      string,
      { light: number; medium: number; heavy: number; super_heavy: number }
    >();

    for (const t of trucks) {
      typeCounts.set(t.truckType, (typeCounts.get(t.truckType) ?? 0) + 1);
      classCounts.set(t.truckClass, (classCounts.get(t.truckClass) ?? 0) + 1);

      if (!typeClassCounts.has(t.truckType)) {
        typeClassCounts.set(t.truckType, {
          light: 0,
          medium: 0,
          heavy: 0,
          super_heavy: 0,
        });
      }
      const entry = typeClassCounts.get(t.truckType)!;
      entry[t.truckClass]++;
    }

    return {
      byType: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      byClass: Array.from(classCounts.entries())
        .map(([truckClass, count]) => ({ truckClass, count }))
        .sort((a, b) => b.count - a.count),
      byTypeAndClass: Array.from(typeClassCounts.entries())
        .map(([type, classes]) => ({ type, ...classes }))
        .sort((a, b) => {
          const totalA = a.light + a.medium + a.heavy + a.super_heavy;
          const totalB = b.light + b.medium + b.heavy + b.super_heavy;
          return totalB - totalA;
        }),
    };
  },
});

// ============================================================================
// HOURLY DISTRIBUTION
// ============================================================================

/**
 * Get booking distribution by hour of day.
 * Shows how bookings are spread across the day.
 */
export const getHourlyDistribution = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
    date: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      hour: v.number(),
      label: v.string(),
      bookings: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return [];
    }

    // Determine terminals
    let terminalIds: Id<"terminals">[];
    if (args.terminalId) {
      const canAccess = await canManageTerminal(ctx, user, args.terminalId);
      if (!canAccess) return [];
      terminalIds = [args.terminalId];
    } else {
      terminalIds = await getManagedTerminalIds(ctx, user);
    }

    // Collect bookings
    const allBookings: Doc<"bookings">[] = [];
    for (const terminalId of terminalIds) {
      let bookingsQuery;
      if (args.date) {
        bookingsQuery = ctx.db
          .query("bookings")
          .withIndex("by_terminal_and_date", (q) =>
            q.eq("terminalId", terminalId).eq("preferredDate", args.date!)
          );
      } else {
        bookingsQuery = ctx.db
          .query("bookings")
          .withIndex("by_terminal", (q) => q.eq("terminalId", terminalId));
      }
      const bookings = await bookingsQuery.collect();
      allBookings.push(...bookings);
    }

    // Initialize 24 hours
    const hourCounts = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0);
    }

    // Parse preferredTimeStart to get hour
    for (const booking of allBookings) {
      const hour = parseInt(booking.preferredTimeStart.split(":")[0], 10);
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    }

    return Array.from(hourCounts.entries())
      .map(([hour, bookings]) => ({
        hour,
        label: `${hour.toString().padStart(2, "0")}:00`,
        bookings,
      }))
      .sort((a, b) => a.hour - b.hour);
  },
});

// ============================================================================
// TOP CARRIERS
// ============================================================================

/**
 * Get top carriers by booking volume.
 * Port admin only.
 */
export const getTopCarriers = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      carrierId: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      bookingCount: v.number(),
      containerCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const limit = args.limit ?? 10;

    // Get all bookings and group by carrierId
    const allBookings = await ctx.db.query("bookings").collect();
    const carrierMap = new Map<
      string,
      { bookingCount: number; containerCount: number }
    >();

    for (const b of allBookings) {
      const entry = carrierMap.get(b.carrierId) ?? {
        bookingCount: 0,
        containerCount: 0,
      };
      entry.bookingCount++;
      entry.containerCount += b.containerIds.length;
      carrierMap.set(b.carrierId, entry);
    }

    // Sort by booking count and take top N
    const sorted = Array.from(carrierMap.entries())
      .sort(([, a], [, b]) => b.bookingCount - a.bookingCount)
      .slice(0, limit);

    // Enrich with user info from Better Auth
    const results = [];
    for (const [carrierId, stats] of sorted) {
      let name: string | undefined;
      let email: string | undefined;

      try {
        const authUser = await authComponent.getAnyUserById(ctx, carrierId);
        if (authUser) {
          name = authUser.name;
          email = authUser.email;
        }
      } catch {
        // User not found
      }

      results.push({
        carrierId,
        name,
        email,
        bookingCount: stats.bookingCount,
        containerCount: stats.containerCount,
      });
    }

    return results;
  },
});

// ============================================================================
// OPERATOR BOOKING PROCESSING
// ============================================================================

/**
 * Get auto-validated vs manually processed booking stats for a terminal.
 * Shows how many bookings were auto-approved vs manually processed.
 */
export const getOperatorProcessing = query({
  args: {
    terminalId: v.id("terminals"),
  },
  returns: v.object({
    autoValidated: v.number(),
    manuallyProcessed: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isPortAdmin(user) && !isTerminalOperator(user)) {
      return { autoValidated: 0, manuallyProcessed: 0, total: 0 };
    }

    const canAccess = await canManageTerminal(ctx, user, args.terminalId);
    if (!canAccess) {
      return { autoValidated: 0, manuallyProcessed: 0, total: 0 };
    }

    // Get confirmed bookings for this terminal
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_status", (q) =>
        q.eq("terminalId", args.terminalId).eq("status", "confirmed")
      )
      .collect();

    // Also include consumed (they were confirmed at some point)
    const consumedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_terminal_and_status", (q) =>
        q.eq("terminalId", args.terminalId).eq("status", "consumed")
      )
      .collect();

    const allProcessed = [...confirmedBookings, ...consumedBookings];
    let autoValidated = 0;
    let manuallyProcessed = 0;

    for (const b of allProcessed) {
      if (b.wasAutoValidated) {
        autoValidated++;
      } else {
        manuallyProcessed++;
      }
    }

    return {
      autoValidated,
      manuallyProcessed,
      total: allProcessed.length,
    };
  },
});
