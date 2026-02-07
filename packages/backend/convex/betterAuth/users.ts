/**
 * User queries for Better Auth component
 * These can directly access the Better Auth `user` table
 */
import { query } from "./_generated/server";
import { v } from "convex/values";

/** Better Auth role validator (includes "user" as default) */
const betterAuthRoleValidator = v.union(
  v.literal("port_admin"),
  v.literal("terminal_operator"),
  v.literal("carrier"),
);

/**
 * List all users from Better Auth
 * This query runs inside the component and can access the `user` table
 */
export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.string(),
      email: v.string(),
      name: v.string(),
      role: betterAuthRoleValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
      emailVerified: v.boolean(),
      banned: v.optional(v.union(v.null(), v.boolean())),
    })
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      emailVerified: u.emailVerified,
      banned: u.banned,
    }));
  },
});

/**
 * List users by role
 */
export const listByRole = query({
  args: { role: betterAuthRoleValidator },
  returns: v.array(
    v.object({
      _id: v.string(),
      email: v.string(),
      name: v.string(),
      role: betterAuthRoleValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Use index if available, otherwise filter
    const users = await ctx.db.query("user").collect();
    return users
      .filter((u) => u.role === args.role)
      .map((u) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
  },
});
