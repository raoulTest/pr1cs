/**
 * Chat Queries
 *
 * Reactive queries for thread messages. These run in the Convex V8 runtime
 * (not Node.js) so they can be subscribed to for real-time updates.
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { listMessages } from "@convex-dev/agent";
import { components } from "../_generated/api";

// ============================================================================
// THREAD QUERIES
// ============================================================================

/**
 * List threads for a user.
 * Returns threads sorted by most recent first.
 */
export const listUserThreads = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: args.userId,
        order: "desc",
        paginationOpts: {
          cursor: null,
          numItems: args.limit ?? 50,
        },
      }
    );
    return result;
  },
});

/**
 * List messages in a thread (for initial load & real-time updates).
 * The frontend subscribes to this for live streaming.
 *
 * Uses the standalone `listMessages` function which works in the V8 runtime.
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: v.any(),
  },
  handler: async (ctx, args) => {
    return await listMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
  },
});
