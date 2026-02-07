/**
 * Audit Mutations
 *
 * Internal mutations for logging actions to the audit trail.
 * These are only callable from other Convex functions, not from clients.
 */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { auditActionValidator } from "../schema";

/**
 * Log an action to the audit trail (internal only)
 */
export const log = internalMutation({
  args: {
    userId: v.optional(v.string()),
    action: auditActionValidator,
    resource: v.string(),
    resourceId: v.optional(v.string()),
    args: v.optional(v.string()),
    result: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    aiThreadId: v.optional(v.string()),
    aiToolName: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
