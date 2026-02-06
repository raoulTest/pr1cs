/**
 * Terminal Tools
 *
 * Tools for querying terminal and gate information, plus slot availability.
 * Role access is enforced inside each handler via checkToolAccess.
 * Frontend components: <TerminalCard />, <TerminalList />, <SlotGrid />
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess } from "./types";

// ============================================================================
// QUERY TOOLS
// ============================================================================

/**
 * List all terminals the user can see.
 * Frontend component: <TerminalList />
 */
export const listTerminals = createTool({
  description:
    "List all available terminals. Shows name, code, address, timezone, " +
    "active status, and gate count.",
  args: z.object({
    activeOnly: z
      .boolean()
      .optional()
      .describe("Only show active terminals (default true)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listTerminals");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.listTerminals,
      {
        userId: ctx.userId!,
        activeOnly: args.activeOnly ?? true,
      },
    );
  },
});

/**
 * Get detailed info about a single terminal including its gates.
 * Frontend component: <TerminalCard />
 */
export const getTerminalDetails = createTool({
  description:
    "Get detailed information about a specific terminal by its code " +
    "(e.g. 'TRM-001'). Includes terminal info, list of gates with " +
    "their capacity, allowed truck types, and current status.",
  args: z.object({
    terminalCode: z.string().describe("Terminal code (e.g. 'TRM-001')"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getTerminalDetails");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.getTerminalDetails,
      {
        terminalCode: args.terminalCode,
      },
    );
  },
});

/**
 * Get available time slots for a given gate and date range.
 * Frontend component: <SlotGrid />
 */
export const getAvailableSlots = createTool({
  description:
    "Get available time slots for booking. You can filter by terminal code, " +
    "gate code, and date. Shows slot times, remaining capacity, and " +
    "booking availability.",
  args: z.object({
    terminalCode: z.string().describe("Terminal code (e.g. 'TRM-001')"),
    gateCode: z
      .string()
      .optional()
      .describe("Specific gate code (e.g. 'GATE-A1'). If omitted, shows all gates."),
    date: z
      .string()
      .describe("Date in YYYY-MM-DD format to check availability"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getAvailableSlots");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.getAvailableSlots,
      {
        terminalCode: args.terminalCode,
        gateCode: args.gateCode,
        date: args.date,
      },
    );
  },
});
