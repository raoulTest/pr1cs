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
  languageValidator,
  notificationChannelValidator,
} from "../lib/validators";
import { authComponent, createAuth } from "../auth";

/** Role validator for Better Auth roles */
const betterAuthRoleValidator = v.union(
  v.literal("port_admin"),
  v.literal("terminal_operator"),
  v.literal("carrier"),
  v.literal("user")
);

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

    // Create new profile (shouldn't normally happen as trigger creates it)
    return await ctx.db.insert("userProfiles", {
      userId: user.userId,
      preferredLanguage: args.preferredLanguage ?? "fr",
      notificationChannel: args.notificationChannel ?? "in_app",
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Set user's role (admin only)
 * Uses Better Auth admin plugin to update role in the user table
 */
export const setRole = mutation({
  args: {
    userId: v.string(),
    role: betterAuthRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Use Better Auth admin API to set user role
    // Cast to any because our custom roles are configured in the admin plugin
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    await auth.api.setRole({
      body: {
        userId: args.userId,
        role: args.role as string,
      },
      headers,
    } as any);

    return null;
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

    // Verify user has terminal_operator role by checking Better Auth user
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    
    const targetRole = (targetUser as unknown as { role: string }).role;
    if (targetRole !== "terminal_operator") {
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
