/**
 * Booking Tools
 *
 * Tools that let the AI agent query and display booking data.
 * Each tool returns structured data that maps to a custom UI component.
 * Role access is enforced inside each handler via checkToolAccess.
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess, toolResult, displayArg } from "./types";

// ============================================================================
// QUERY TOOLS
// ============================================================================

/**
 * List the current user's bookings (carrier role).
 * Frontend component: <BookingList />
 */
export const listMyBookings = createTool({
  description:
    "List the current user's bookings. Optionally filter by status and/or date. " +
    "Returns a list of bookings with terminal, gate, truck, and time slot info.",
  args: z.object({
    status: z
      .enum([
        "pending",
        "confirmed",
        "rejected",
        "consumed",
        "cancelled",
        "expired",
      ])
      .optional()
      .describe("Filter by booking status"),
    date: z
      .string()
      .optional()
      .describe("Filter by date in YYYY-MM-DD format"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of bookings to return (default 20)"),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listMyBookings");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.listMyBookings,
      {
        userId: ctx.userId!,
        status: args.status,
        date: args.date,
        limit: args.limit ?? 20,
      },
    );
    return toolResult(data, args._display ?? true);
  },
});

/**
 * Get full details of a single booking by reference or ID.
 * Frontend component: <BookingCard />
 */
export const getBookingDetails = createTool({
  description:
    "Get detailed information about a specific booking by its reference number " +
    "(e.g. 'BK-20240115-001'). Returns full booking details including terminal, " +
    "gate, truck, driver, cargo, and status timeline.",
  args: z.object({
    bookingReference: z
      .string()
      .describe(
        "The booking reference number (e.g. 'BK-20240115-001')",
      ),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getBookingDetails");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.getBookingByReference,
      {
        userId: ctx.userId!,
        bookingReference: args.bookingReference,
      },
    );
    return toolResult(data, args._display ?? true);
  },
});

/**
 * List bookings for a specific terminal (operator/admin).
 * Frontend component: <BookingList />
 */
export const listBookingsByTerminal = createTool({
  description:
    "List bookings for a specific terminal. For terminal operators and admins. " +
    "Optionally filter by status and date.",
  args: z.object({
    terminalCode: z.string().describe("Terminal code (e.g. 'TRM-001')"),
    status: z
      .enum([
        "pending",
        "confirmed",
        "rejected",
        "consumed",
        "cancelled",
        "expired",
      ])
      .optional()
      .describe("Filter by booking status"),
    date: z
      .string()
      .optional()
      .describe("Filter by date in YYYY-MM-DD format"),
    limit: z.number().optional().describe("Maximum results (default 50)"),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listBookingsByTerminal");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.listBookingsByTerminal,
      {
        userId: ctx.userId!,
        terminalCode: args.terminalCode,
        status: args.status,
        date: args.date,
        limit: args.limit ?? 50,
      },
    );
    return toolResult(data, args._display ?? true);
  },
});

/**
 * List bookings for a specific carrier company (admin).
 * Frontend component: <BookingList />
 */
export const listBookingsByCarrier = createTool({
  description:
    "List bookings for a specific carrier. For port admins only. " +
    "Optionally filter by status.",
  args: z.object({
    carrierId: z.string().describe("Carrier user ID"),
    status: z
      .enum([
        "pending",
        "confirmed",
        "rejected",
        "consumed",
        "cancelled",
        "expired",
      ])
      .optional()
      .describe("Filter by booking status"),
    limit: z.number().optional().describe("Maximum results (default 50)"),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listBookingsByCarrier");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.listBookingsByCarrier,
      {
        userId: ctx.userId!,
        carrierId: args.carrierId,
        status: args.status,
        limit: args.limit ?? 50,
      },
    );
    return toolResult(data, args._display ?? true);
  },
});

/**
 * List pending bookings requiring operator action.
 * Frontend component: <PendingBookingsList />
 */
export const listPendingBookings = createTool({
  description:
    "List all pending bookings awaiting confirmation. " +
    "For terminal operators (their terminals) and port admins (all terminals).",
  args: z.object({
    terminalCode: z
      .string()
      .optional()
      .describe("Optionally filter by terminal code"),
    limit: z.number().optional().describe("Maximum results (default 50)"),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listPendingBookings");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.listPendingBookings,
      {
        userId: ctx.userId!,
        terminalCode: args.terminalCode,
        limit: args.limit ?? 50,
      },
    );
    return toolResult(data, args._display ?? true);
  },
});

/**
 * List all bookings across all terminals (operator/admin).
 * Replaces the need to call listBookingsByTerminal N times.
 * Frontend component: <BookingList />
 */
export const listAllBookings = createTool({
  description:
    "List all bookings across all terminals. Supports optional filters by terminal, status, and date. " +
    "Use this instead of calling listBookingsByTerminal multiple times. " +
    "Only for port_admin and terminal_operator roles.",
  args: z.object({
    terminalCode: z
      .string()
      .optional()
      .describe("Filter by terminal code (e.g. 'TER1'). Omit to see all terminals."),
    status: z
      .enum([
        "pending",
        "confirmed",
        "rejected",
        "consumed",
        "cancelled",
        "expired",
      ])
      .optional()
      .describe("Filter by booking status."),
    date: z
      .string()
      .optional()
      .describe("Filter by date in YYYY-MM-DD format."),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results (default 50)."),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listAllBookings");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.listAllBookings,
      {
        userId: ctx.userId!,
        terminalCode: args.terminalCode,
        status: args.status,
        date: args.date,
        limit: args.limit ?? 50,
      },
    );

    return toolResult(data, args._display ?? true);
  },
});
