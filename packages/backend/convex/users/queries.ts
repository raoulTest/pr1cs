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
import { apcsRoleValidator, languageValidator, notificationChannelValidator } from "../lib/validators";

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
      carrierCompanyId: v.union(v.id("carrierCompanies"), v.null()),
      isCompanyAdmin: v.boolean(),
    }),
    v.null()
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
      carrierCompanyId: user.carrierCompanyId,
      isCompanyAdmin: user.isCompanyAdmin,
    };
  },
});

/**
 * Get a user's profile by ID (admin only)
 */
export const getProfile = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("userProfiles"),
      userId: v.string(),
      apcsRole: v.union(apcsRoleValidator, v.null()),
      preferredLanguage: languageValidator,
      notificationChannel: notificationChannelValidator,
      phone: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    return {
      _id: profile._id,
      userId: profile.userId,
      apcsRole: profile.apcsRole ?? null,
      preferredLanguage: profile.preferredLanguage,
      notificationChannel: profile.notificationChannel,
      phone: profile.phone,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },
});

/**
 * List all terminal operators
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
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Get all profiles with terminal_operator role
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("apcsRole", "terminal_operator"))
      .collect();

    const result = await Promise.all(
      profiles.map(async (profile) => {
        // Get their terminal assignments
        let assignments = await ctx.db
          .query("terminalOperatorAssignments")
          .withIndex("by_user_and_active", (q) =>
            q.eq("userId", profile.userId).eq("isActive", true)
          )
          .collect();

        // Filter by terminal if specified
        if (args.terminalId) {
          assignments = assignments.filter(
            (a) => a.terminalId === args.terminalId
          );
        }

        return {
          userId: profile.userId,
          apcsRole: profile.apcsRole ?? null,
          assignedTerminals: assignments.map((a) => a.terminalId),
        };
      })
    );

    // Filter out operators with no assignments if terminal filter applied
    if (args.terminalId) {
      return result.filter((r) => r.assignedTerminals.length > 0);
    }

    return result;
  },
});

/**
 * List users by role
 */
export const listByRole = query({
  args: { role: apcsRoleValidator },
  returns: v.array(
    v.object({
      userId: v.string(),
      apcsRole: v.union(apcsRoleValidator, v.null()),
      preferredLanguage: languageValidator,
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("apcsRole", args.role))
      .collect();

    return profiles.map((p) => ({
      userId: p.userId,
      apcsRole: p.apcsRole ?? null,
      preferredLanguage: p.preferredLanguage,
      createdAt: p.createdAt,
    }));
  },
});
