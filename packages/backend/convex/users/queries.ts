/**
 * User Profile Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  getOptionalAuthenticatedUser,
  requireRole,
} from "../lib/permissions";
import {
  apcsRoleValidator,
  languageValidator,
  notificationChannelValidator,
} from "../lib/validators";
import { authComponent } from "../auth";
import { components } from "../_generated/api";

/** Better Auth role validator (includes "user" as default) */
const betterAuthRoleValidator = v.union(
  v.literal("port_admin"),
  v.literal("terminal_operator"),
  v.literal("carrier"),
  v.literal("user"),
);

/**
 * Get current user's profile
 */
export const getMyProfile = query({
  args: {},
  returns: v.union(
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      apcsRole: v.union(apcsRoleValidator, v.null()),
      preferredLanguage: v.optional(languageValidator),
      notificationChannel: v.optional(notificationChannelValidator),
      phone: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await getOptionalAuthenticatedUser(ctx);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      apcsRole: user.apcsRole,
      preferredLanguage: profile?.preferredLanguage,
      notificationChannel: profile?.notificationChannel,
      phone: profile?.phone,
    };
  },
});

/**
 * Get a user's profile by ID (admin only)
 * Returns role from Better Auth and preferences from userProfiles
 */
export const getProfile = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      role: betterAuthRoleValidator,
      preferredLanguage: v.optional(languageValidator),
      notificationChannel: v.optional(notificationChannelValidator),
      phone: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Get user from Better Auth
    const authUser = await authComponent.getAnyUserById(ctx, args.userId);
    if (!authUser) return null;

    // Get preferences from userProfiles
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    return {
      userId: authUser._id,
      email: authUser.email,
      name: authUser.name,
      role: (authUser as unknown as { role: string }).role as
        | "port_admin"
        | "terminal_operator"
        | "carrier"
        | "user",
      preferredLanguage: profile?.preferredLanguage,
      notificationChannel: profile?.notificationChannel,
      phone: profile?.phone,
      createdAt: profile?.createdAt,
      updatedAt: profile?.updatedAt,
    };
  },
});

/**
 * List all terminal operators
 * Gets operators from terminal assignments and fetches their role from Better Auth
 */
export const listOperators = query({
  args: {
    terminalId: v.optional(v.id("terminals")),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      apcsRole: v.union(apcsRoleValidator, v.null()),
      assignedTerminals: v.array(v.id("terminals")),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Get terminal operator assignments
    let assignments;
    if (args.terminalId) {
      // Filter by specific terminal
      assignments = await ctx.db
        .query("terminalOperatorAssignments")
        .withIndex("by_terminal_and_active", (q) =>
          q.eq("terminalId", args.terminalId!).eq("isActive", true),
        )
        .collect();
    } else {
      // Get all active assignments
      assignments = await ctx.db
        .query("terminalOperatorAssignments")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Group by user
    const userTerminals = new Map<string, Set<string>>();
    for (const a of assignments) {
      if (!userTerminals.has(a.userId)) {
        userTerminals.set(a.userId, new Set());
      }
      userTerminals.get(a.userId)!.add(a.terminalId);
    }

    // Fetch user roles from Better Auth
    const result = await Promise.all(
      Array.from(userTerminals.entries()).map(async ([userId, terminals]) => {
        const authUser = await authComponent.getAnyUserById(ctx, userId);
        const role = authUser
          ? (authUser as unknown as { role: string }).role
          : null;

        // Only include if role is terminal_operator
        const apcsRole =
          role === "terminal_operator" ? ("terminal_operator" as const) : null;

        return {
          userId,
          apcsRole,
          assignedTerminals: Array.from(terminals) as any[],
        };
      }),
    );

    // Filter to only terminal operators
    return result.filter((r) => r.apcsRole === "terminal_operator");
  },
});

/**
 * List users by role
 * Note: This now requires fetching all users from Better Auth since roles are stored there
 */
export const listByRole = query({
  args: { role: apcsRoleValidator },
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      role: betterAuthRoleValidator,
      preferredLanguage: v.optional(languageValidator),
      createdAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Use Better Auth component directly to list users by role
    const authUsers = await ctx.runQuery(
      components.betterAuth.users.listByRole,
      { role: args.role },
    );

    // Get userProfiles for preferences (optional enrichment)
    const profiles = await ctx.db.query("userProfiles").collect();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return authUsers.map((authUser) => {
      const profile = profileMap.get(authUser._id);
      return {
        userId: authUser._id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role as
          | "port_admin"
          | "terminal_operator"
          | "carrier"
          | "user",
        preferredLanguage: profile?.preferredLanguage,
        createdAt: authUser.createdAt,
      };
    });
  },
});

/**
 * List ALL users from Better Auth component
 * This fetches directly from the Better Auth user table
 */
export const listAllUsers = query({
  args: {},
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.string(),
      role: betterAuthRoleValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
      emailVerified: v.boolean(),
      banned: v.optional(v.union(v.null(), v.boolean())),
      // Profile data (optional, may not exist yet)
      preferredLanguage: v.optional(languageValidator),
      notificationChannel: v.optional(notificationChannelValidator),
      phone: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Fetch all users from Better Auth component
    const authUsers = await ctx.runQuery(
      components.betterAuth.users.listAll,
      {},
    );

    // Get all userProfiles for preferences
    const profiles = await ctx.db.query("userProfiles").collect();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // Combine auth users with profile data
    return authUsers.map((authUser) => {
      const profile = profileMap.get(authUser._id);
      return {
        userId: authUser._id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role as
          | "port_admin"
          | "terminal_operator"
          | "carrier"
          | "user",
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        emailVerified: authUser.emailVerified,
        banned: authUser.banned,
        preferredLanguage: profile?.preferredLanguage,
        notificationChannel: profile?.notificationChannel,
        phone: profile?.phone,
      };
    });
  },
});
