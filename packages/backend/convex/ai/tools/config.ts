/**
 * System Configuration Tools
 *
 * Tools for querying system-wide configuration and policies.
 * Role access is enforced inside each handler via checkToolAccess.
 * Frontend component: <SystemConfigCard />
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess, toolResult, displayArg } from "./types";

// ============================================================================
// QUERY TOOLS
// ============================================================================

/**
 * Get system configuration (booking policies, cancellation window, etc.).
 * Frontend component: <SystemConfigCard />
 */
export const getSystemConfig = createTool({
  description:
    "Get the system configuration including booking policies: " +
    "cancellation window, max advance booking days, minimum booking lead time, " +
    "and reminder settings. Useful when the user asks about rules or policies.",
  args: z.object({
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getSystemConfig");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.getSystemConfig,
      {},
    );
    // Default to hidden — config is typically fetched for internal reasoning
    return toolResult(data, args._display ?? false);
  },
});
