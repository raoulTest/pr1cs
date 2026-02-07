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

// ============================================================================
// USER MANAGEMENT (Admin Only)
// ============================================================================

/**
 * Create a new user (admin only)
 * Uses Better Auth admin plugin to create user with email/password
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: betterAuthRoleValidator,
  },
  returns: v.object({
    userId: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (args.password.length < 8) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Password must be at least 8 characters",
      });
    }

    // Use Better Auth admin API to create user
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      const result = await auth.api.createUser({
        body: {
          email: args.email,
          password: args.password,
          name: args.name,
          role: args.role as string,
        },
        headers,
      } as any);

      if (!result) {
        throw new ConvexError({
          code: "INTERNAL_ERROR",
          message: "Failed to create user",
        });
      }

      return { userId: (result as any).id || (result as any).user?.id };
    } catch (error: any) {
      // Handle specific errors
      if (error.message?.includes("already exists") || error.body?.code === "USER_ALREADY_EXISTS") {
        throw new ConvexError({
          code: "ALREADY_EXISTS",
          message: "A user with this email already exists",
        });
      }
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to create user",
      });
    }
  },
});

/**
 * Update user details (admin only)
 * Uses Better Auth admin plugin to update user information
 */
export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Verify user exists
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Validate email if provided
    if (args.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "Invalid email format",
        });
      }
    }

    // Build update data
    const updateData: Record<string, any> = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;

    if (Object.keys(updateData).length === 0) {
      return null; // Nothing to update
    }

    // Use Better Auth admin API to update user
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      await auth.api.updateUser({
        body: {
          userId: args.userId,
          data: updateData,
        },
        headers,
      } as any);
    } catch (error: any) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to update user",
      });
    }

    return null;
  },
});

/**
 * Ban a user (admin only)
 * Prevents the user from signing in and revokes all sessions
 */
export const banUser = mutation({
  args: {
    userId: v.string(),
    reason: v.optional(v.string()),
    expiresInDays: v.optional(v.number()), // null = permanent
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Cannot ban yourself
    if (args.userId === user.userId) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "You cannot ban yourself",
      });
    }

    // Verify user exists
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Use Better Auth admin API to ban user
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      const banBody: any = {
        userId: args.userId,
      };
      
      if (args.reason) {
        banBody.banReason = args.reason;
      }
      
      if (args.expiresInDays) {
        // Convert days to seconds
        banBody.banExpiresIn = args.expiresInDays * 24 * 60 * 60;
      }

      await auth.api.banUser({
        body: banBody,
        headers,
      } as any);
    } catch (error: any) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to ban user",
      });
    }

    return null;
  },
});

/**
 * Unban a user (admin only)
 * Allows the user to sign in again
 */
export const unbanUser = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Verify user exists
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Use Better Auth admin API to unban user
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      await auth.api.unbanUser({
        body: {
          userId: args.userId,
        },
        headers,
      } as any);
    } catch (error: any) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to unban user",
      });
    }

    return null;
  },
});

/**
 * Delete a user (admin only)
 * Permanently removes the user from the system
 */
export const removeUser = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Cannot delete yourself
    if (args.userId === user.userId) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "You cannot delete yourself",
      });
    }

    // Verify user exists
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Use Better Auth admin API to remove user
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      await auth.api.removeUser({
        body: {
          userId: args.userId,
        },
        headers,
      } as any);
    } catch (error: any) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to delete user",
      });
    }

    // Also delete the user's profile if it exists
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // Deactivate any terminal operator assignments
    const assignments = await ctx.db
      .query("terminalOperatorAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    return null;
  },
});

/**
 * Reset user password (admin only)
 * Sets a new password for the user
 */
export const resetUserPassword = mutation({
  args: {
    userId: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Validate password strength
    if (args.newPassword.length < 8) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Password must be at least 8 characters",
      });
    }

    // Verify user exists
    const targetUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Use Better Auth admin API to set password
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    
    try {
      await auth.api.setUserPassword({
        body: {
          userId: args.userId,
          newPassword: args.newPassword,
        },
        headers,
      } as any);
    } catch (error: any) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to reset password",
      });
    }

    return null;
  },
});
