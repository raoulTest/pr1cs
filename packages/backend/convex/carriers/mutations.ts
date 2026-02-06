/**
 * Carrier Company Mutations
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  canManageCarrier,
  isPortAdmin,
  isCarrier,
} from "../lib/permissions";
import { languageValidator, notificationChannelValidator } from "../lib/validators";

/**
 * Create a new carrier company (admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    taxId: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(languageValidator),
    notificationChannel: v.optional(notificationChannelValidator),
  },
  returns: v.id("carrierCompanies"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    // Check code uniqueness
    const existing = await ctx.db
      .query("carrierCompanies")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: `Carrier company with code ${args.code} already exists`,
      });
    }

    const now = Date.now();
    return await ctx.db.insert("carrierCompanies", {
      name: args.name,
      code: args.code,
      taxId: args.taxId,
      address: args.address,
      phone: args.phone,
      email: args.email,
      preferredLanguage: args.preferredLanguage ?? "en",
      notificationChannel: args.notificationChannel ?? "both",
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });
  },
});

/**
 * Self-register a carrier company (for new carrier users)
 */
export const selfRegister = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    taxId: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(languageValidator),
    notificationChannel: v.optional(notificationChannelValidator),
  },
  returns: v.id("carrierCompanies"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // User must not already be in a carrier company
    const existingCarrierUser = await ctx.db
      .query("carrierUsers")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    if (existingCarrierUser) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "You are already associated with a carrier company",
      });
    }

    // Check code uniqueness
    const existing = await ctx.db
      .query("carrierCompanies")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: `Carrier company with code ${args.code} already exists`,
      });
    }

    const now = Date.now();

    // Create the company
    const companyId = await ctx.db.insert("carrierCompanies", {
      name: args.name,
      code: args.code,
      taxId: args.taxId,
      address: args.address,
      phone: args.phone,
      email: args.email,
      preferredLanguage: args.preferredLanguage ?? "en",
      notificationChannel: args.notificationChannel ?? "both",
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    });

    // Add user as company admin
    await ctx.db.insert("carrierUsers", {
      userId: user.userId,
      carrierCompanyId: companyId,
      isCompanyAdmin: true,
      joinedAt: now,
      isActive: true,
    });

    // Set user's APCS role to carrier
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        apcsRole: "carrier",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: user.userId,
        apcsRole: "carrier",
        preferredLanguage: args.preferredLanguage ?? "en",
        notificationChannel: args.notificationChannel ?? "both",
        createdAt: now,
        updatedAt: now,
      });
    }

    return companyId;
  },
});

/**
 * Update a carrier company
 */
export const update = mutation({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
    name: v.optional(v.string()),
    taxId: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(languageValidator),
    notificationChannel: v.optional(notificationChannelValidator),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const canManage = await canManageCarrier(ctx, user, args.carrierCompanyId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this company",
      });
    }

    // Only port_admin can change isActive
    if (args.isActive !== undefined && !isPortAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only port admins can activate/deactivate companies",
      });
    }

    const { carrierCompanyId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(carrierCompanyId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Invite a user to a carrier company
 */
export const inviteUser = mutation({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
    userId: v.string(),
    isCompanyAdmin: v.optional(v.boolean()),
  },
  returns: v.id("carrierUsers"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const canManage = await canManageCarrier(ctx, user, args.carrierCompanyId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to invite users to this company",
      });
    }

    // Check if user is already in a company
    const existingCarrierUser = await ctx.db
      .query("carrierUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingCarrierUser) {
      if (existingCarrierUser.carrierCompanyId === args.carrierCompanyId) {
        // Reactivate if same company
        if (!existingCarrierUser.isActive) {
          await ctx.db.patch(existingCarrierUser._id, {
            isActive: true,
            isCompanyAdmin: args.isCompanyAdmin ?? false,
          });
          return existingCarrierUser._id;
        }
        throw new ConvexError({
          code: "ALREADY_EXISTS",
          message: "User is already a member of this company",
        });
      }
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "User is already associated with another carrier company",
      });
    }

    const now = Date.now();

    // Create carrier user link
    const carrierUserId = await ctx.db.insert("carrierUsers", {
      userId: args.userId,
      carrierCompanyId: args.carrierCompanyId,
      isCompanyAdmin: args.isCompanyAdmin ?? false,
      joinedAt: now,
      invitedBy: user.userId,
      isActive: true,
    });

    // Set user's APCS role to carrier
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        apcsRole: "carrier",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        apcsRole: "carrier",
        preferredLanguage: "en",
        notificationChannel: "in_app",
        createdAt: now,
        updatedAt: now,
      });
    }

    return carrierUserId;
  },
});

/**
 * Remove a user from a carrier company
 */
export const removeUser = mutation({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const canManage = await canManageCarrier(ctx, user, args.carrierCompanyId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to remove users from this company",
      });
    }

    // Can't remove yourself if you're the only admin
    if (args.userId === user.userId) {
      const admins = await ctx.db
        .query("carrierUsers")
        .withIndex("by_company_and_active", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId).eq("isActive", true)
        )
        .collect();

      const activeAdmins = admins.filter((a) => a.isCompanyAdmin);
      if (activeAdmins.length <= 1) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message:
            "Cannot remove the only company admin. Promote another admin first.",
        });
      }
    }

    const carrierUser = await ctx.db
      .query("carrierUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (carrierUser && carrierUser.carrierCompanyId === args.carrierCompanyId) {
      await ctx.db.patch(carrierUser._id, { isActive: false });
    }

    return null;
  },
});

/**
 * Update a carrier user's admin status
 */
export const setUserAdmin = mutation({
  args: {
    carrierCompanyId: v.id("carrierCompanies"),
    userId: v.string(),
    isCompanyAdmin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const canManage = await canManageCarrier(ctx, user, args.carrierCompanyId);
    if (!canManage) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to manage this company",
      });
    }

    // Can't demote yourself if you're the only admin
    if (args.userId === user.userId && !args.isCompanyAdmin) {
      const admins = await ctx.db
        .query("carrierUsers")
        .withIndex("by_company_and_active", (q) =>
          q.eq("carrierCompanyId", args.carrierCompanyId).eq("isActive", true)
        )
        .collect();

      const activeAdmins = admins.filter((a) => a.isCompanyAdmin);
      if (activeAdmins.length <= 1) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message:
            "Cannot demote the only company admin. Promote another admin first.",
        });
      }
    }

    const carrierUser = await ctx.db
      .query("carrierUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (carrierUser && carrierUser.carrierCompanyId === args.carrierCompanyId) {
      await ctx.db.patch(carrierUser._id, {
        isCompanyAdmin: args.isCompanyAdmin,
      });
    }

    return null;
  },
});
