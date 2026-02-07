/**
 * Audit Log Queries
 *
 * Queries for retrieving and filtering audit log entries.
 * All queries are admin-only.
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireRole } from "../lib/permissions";
import { auditActionValidator } from "../lib/validators";
import { authComponent } from "../auth";
import type { Id } from "../_generated/dataModel";

/**
 * List audit logs with filtering and pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    userId: v.optional(v.string()),
    action: v.optional(auditActionValidator),
    resource: v.optional(v.string()),
    fromTimestamp: v.optional(v.number()),
    toTimestamp: v.optional(v.number()),
    resultFilter: v.optional(v.union(v.literal("success"), v.literal("error"))),
  },
  returns: v.object({
    logs: v.array(
      v.object({
        _id: v.id("auditLogs"),
        userId: v.optional(v.string()),
        userName: v.optional(v.string()),
        userEmail: v.optional(v.string()),
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
        timestamp: v.number(),
        durationMs: v.optional(v.number()),
      })
    ),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const limit = args.limit ?? 50;

    // Build base query - order by timestamp descending (most recent first)
    let logsQuery = ctx.db.query("auditLogs").withIndex("by_timestamp");

    // Apply filters based on indexes
    if (args.userId) {
      logsQuery = ctx.db
        .query("auditLogs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    } else if (args.action) {
      logsQuery = ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action!));
    } else if (args.resource) {
      logsQuery = ctx.db
        .query("auditLogs")
        .withIndex("by_resource", (q) => q.eq("resource", args.resource!));
    }

    // Collect all logs and apply additional filters
    let allLogs = await logsQuery.order("desc").collect();

    // Apply timestamp filters
    if (args.fromTimestamp) {
      allLogs = allLogs.filter((log) => log.timestamp >= args.fromTimestamp!);
    }
    if (args.toTimestamp) {
      allLogs = allLogs.filter((log) => log.timestamp <= args.toTimestamp!);
    }

    // Apply result filter
    if (args.resultFilter === "success") {
      allLogs = allLogs.filter(
        (log) => log.result === "success" || !log.errorMessage
      );
    } else if (args.resultFilter === "error") {
      allLogs = allLogs.filter(
        (log) =>
          log.result?.startsWith("error") || log.errorMessage !== undefined
      );
    }

    // Handle pagination with cursor
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = allLogs.findIndex(
        (log) => log._id === (args.cursor as Id<"auditLogs">)
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedLogs = allLogs.slice(startIndex, startIndex + limit + 1);
    const hasMore = paginatedLogs.length > limit;
    const logsToReturn = paginatedLogs.slice(0, limit);

    // Get unique user IDs for user info lookup
    const userIds = [...new Set(logsToReturn.map((log) => log.userId).filter(Boolean))] as string[];

    // Fetch user info from Better Auth component
    const userMap = new Map<string, { name?: string; email?: string }>();

    for (const userId of userIds) {
      try {
        const authUser = await authComponent.getAnyUserById(ctx, userId);
        if (authUser) {
          userMap.set(userId, { name: authUser.name, email: authUser.email });
        }
      } catch {
        // User not found, skip
      }
    }

    // Map logs with user info
    const enrichedLogs = logsToReturn.map((log) => {
      const userInfo = log.userId ? userMap.get(log.userId) : undefined;
      return {
        _id: log._id,
        userId: log.userId,
        userName: userInfo?.name,
        userEmail: userInfo?.email,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        args: log.args,
        result: log.result,
        errorMessage: log.errorMessage,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        aiThreadId: log.aiThreadId,
        aiToolName: log.aiToolName,
        timestamp: log.timestamp,
        durationMs: log.durationMs,
      };
    });

    return {
      logs: enrichedLogs,
      nextCursor: hasMore ? logsToReturn[logsToReturn.length - 1]._id : null,
      hasMore,
    };
  },
});

/**
 * Get a single audit log by ID
 */
export const getById = query({
  args: {
    id: v.id("auditLogs"),
  },
  returns: v.union(
    v.object({
      _id: v.id("auditLogs"),
      userId: v.optional(v.string()),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
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
      timestamp: v.number(),
      durationMs: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const log = await ctx.db.get(args.id);
    if (!log) return null;

    // Get user info if userId exists
    let userName: string | undefined;
    let userEmail: string | undefined;

    if (log.userId) {
      try {
        const authUser = await authComponent.getAnyUserById(ctx, log.userId);
        if (authUser) {
          userName = authUser.name;
          userEmail = authUser.email;
        }
      } catch {
        // User not found
      }
    }

    return {
      _id: log._id,
      userId: log.userId,
      userName,
      userEmail,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      args: log.args,
      result: log.result,
      errorMessage: log.errorMessage,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      sessionId: log.sessionId,
      aiThreadId: log.aiThreadId,
      aiToolName: log.aiToolName,
      timestamp: log.timestamp,
      durationMs: log.durationMs,
    };
  },
});

/**
 * Get audit log statistics
 */
export const getStats = query({
  args: {
    fromTimestamp: v.optional(v.number()),
    toTimestamp: v.optional(v.number()),
  },
  returns: v.object({
    totalLogs: v.number(),
    byAction: v.array(
      v.object({
        action: v.string(),
        count: v.number(),
      })
    ),
    byResource: v.array(
      v.object({
        resource: v.string(),
        count: v.number(),
      })
    ),
    errorCount: v.number(),
    successCount: v.number(),
    recentActivity: v.array(
      v.object({
        hour: v.number(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Default to last 24 hours if no timestamps provided
    const now = Date.now();
    const fromTimestamp = args.fromTimestamp ?? now - 24 * 60 * 60 * 1000;
    const toTimestamp = args.toTimestamp ?? now;

    // Get all logs in the time range
    const allLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), fromTimestamp),
          q.lte(q.field("timestamp"), toTimestamp)
        )
      )
      .collect();

    // Count by action
    const actionCounts = new Map<string, number>();
    for (const log of allLogs) {
      const count = actionCounts.get(log.action) ?? 0;
      actionCounts.set(log.action, count + 1);
    }

    // Count by resource
    const resourceCounts = new Map<string, number>();
    for (const log of allLogs) {
      const count = resourceCounts.get(log.resource) ?? 0;
      resourceCounts.set(log.resource, count + 1);
    }

    // Count errors vs successes
    let errorCount = 0;
    let successCount = 0;
    for (const log of allLogs) {
      if (log.result?.startsWith("error") || log.errorMessage) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Activity by hour (last 24 hours)
    const hourCounts = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0);
    }
    for (const log of allLogs) {
      const hour = new Date(log.timestamp).getHours();
      const count = hourCounts.get(hour) ?? 0;
      hourCounts.set(hour, count + 1);
    }

    return {
      totalLogs: allLogs.length,
      byAction: Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count),
      byResource: Array.from(resourceCounts.entries())
        .map(([resource, count]) => ({ resource, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 resources
      errorCount,
      successCount,
      recentActivity: Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour),
    };
  },
});

/**
 * Get distinct resources for filtering
 */
export const getDistinctResources = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const logs = await ctx.db.query("auditLogs").collect();
    const resources = [...new Set(logs.map((log) => log.resource))];
    return resources.sort();
  },
});
