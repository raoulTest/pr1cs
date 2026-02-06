/**
 * User Profile Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
} from "../lib/permissions";
import {
  apcsRoleValidator,
  languageValidator,
  notificationChannelValidator,
} from "../lib/validators";

/**
 * Create or update user profile (self-service for preferences)
 */
export const updateMyProfile = mutation({
  args: {
    preferredLanguage: v.optional(languageValidator),
    notificationChannel: v.optional(notificationChannelValidator),
    phone: v.optional(v.string()),
  },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Check if profile exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    if (existing) {
      // Update existing profile
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.preferredLanguage !== undefined) {
        updates.preferredLanguage = args.preferredLanguage;
      }
      if (args.notificationChannel !== undefined) {
        updates.notificationChannel = args.notificationChannel;
      }
      if (args.phone !== undefined) {
        updates.phone = args.phone;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new profile
    return await ctx.db.insert("userProfiles", {
      userId: user.userId,
      apcsRole: undefined, // Role must be set by admin
      preferredLanguage: args.preferredLanguage ?? "en",
      notificationChannel: args.notificationChannel ?? "in_app",
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Set user's APCS role (admin only)
 */
export const setRole = mutation({
  args: {
    userId: v.string(),
    apcsRole: apcsRoleValidator,
  },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const now = Date.now();

    // Check if profile exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apcsRole: args.apcsRole,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new profile with role
    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      apcsRole: args.apcsRole,
      preferredLanguage: "en",
      notificationChannel: "in_app",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Assign terminal operator to terminals
 */
export const assignOperatorToTerminals = mutation({
  args: {
    userId: v.string(),
    terminalIds: v.array(v.id("terminals")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Verify user has terminal_operator role
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile || profile.apcsRole !== "terminal_operator") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "User must have terminal_operator role to be assigned to terminals",
      });
    }

    const now = Date.now();

    // Get existing assignments for this user
    const existingAssignments = await ctx.db
      .query("terminalOperatorAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const existingTerminalIds = new Set(
      existingAssignments.map((a) => a.terminalId)
    );
    const newTerminalIds = new Set(args.terminalIds);

    // Deactivate assignments not in new list
    for (const assignment of existingAssignments) {
      if (!newTerminalIds.has(assignment.terminalId) && assignment.isActive) {
        await ctx.db.patch(assignment._id, { isActive: false });
      }
    }

    // Create or reactivate assignments in new list
    for (const terminalId of args.terminalIds) {
      // Verify terminal exists
      const terminal = await ctx.db.get(terminalId);
      if (!terminal) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: `Terminal ${terminalId} not found`,
        });
      }

      if (existingTerminalIds.has(terminalId)) {
        // Reactivate existing assignment
        const existing = existingAssignments.find(
          (a) => a.terminalId === terminalId
        );
        if (existing && !existing.isActive) {
          await ctx.db.patch(existing._id, { isActive: true });
        }
      } else {
        // Create new assignment
        await ctx.db.insert("terminalOperatorAssignments", {
          userId: args.userId,
          terminalId,
          assignedAt: now,
          assignedBy: user.userId,
          isActive: true,
        });
      }
    }

    return null;
  },
});

/**
 * Remove operator from a terminal
 */
export const removeOperatorFromTerminal = mutation({
  args: {
    userId: v.string(),
    terminalId: v.id("terminals"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const assignment = await ctx.db
      .query("terminalOperatorAssignments")
      .withIndex("by_user_and_terminal", (q) =>
        q.eq("userId", args.userId).eq("terminalId", args.terminalId)
      )
      .unique();

    if (assignment) {
      await ctx.db.patch(assignment._id, { isActive: false });
    }

    return null;
  },
});
