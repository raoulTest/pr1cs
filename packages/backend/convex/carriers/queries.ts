/**
 * Carrier Company Queries
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  isPortAdmin,
  isCarrier,
} from "../lib/permissions";
import { languageValidator, notificationChannelValidator } from "../lib/validators";

/**
 * List carrier companies
 * - Port admins see all
 * - Carriers see only their own company
 */
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("carrierCompanies"),
      _creationTime: v.number(),
      name: v.string(),
      code: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      isActive: v.boolean(),
      truckCount: v.number(),
      userCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    let companies;

    if (isPortAdmin(user)) {
      // Port admins see all
      if (args.activeOnly) {
        companies = await ctx.db
          .query("carrierCompanies")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect();
      } else {
        companies = await ctx.db.query("carrierCompanies").collect();
      }
    } else if (isCarrier(user) && user.carrierCompanyId) {
      // Carriers see only their company
      const company = await ctx.db.get(user.carrierCompanyId);
      companies = company ? [company] : [];
    } else {
      return [];
    }

    // Add counts
    return Promise.all(
      companies.map(async (c) => {
        const trucks = await ctx.db
          .query("trucks")
          .withIndex("by_carrier_and_active", (q) =>
            q.eq("carrierCompanyId", c._id).eq("isActive", true)
          )
          .collect();

        const users = await ctx.db
          .query("carrierUsers")
          .withIndex("by_company_and_active", (q) =>
            q.eq("carrierCompanyId", c._id).eq("isActive", true)
          )
          .collect();

        return {
          _id: c._id,
          _creationTime: c._creationTime,
          name: c.name,
          code: c.code,
          email: c.email,
          phone: c.phone,
          isActive: c.isActive,
          truckCount: trucks.length,
          userCount: users.length,
        };
      })
    );
  },
});

/**
 * Get a single carrier company
 */
export const get = query({
  args: { carrierCompanyId: v.id("carrierCompanies") },
  returns: v.union(
    v.object({
      _id: v.id("carrierCompanies"),
      _creationTime: v.number(),
      name: v.string(),
      code: v.string(),
      taxId: v.optional(v.string()),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      isActive: v.boolean(),
      preferredLanguage: languageValidator,
      notificationChannel: notificationChannelValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
      truckCount: v.number(),
      userCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check access
    if (!isPortAdmin(user)) {
      if (!isCarrier(user) || user.carrierCompanyId !== args.carrierCompanyId) {
        return null;
      }
    }

    const company = await ctx.db.get(args.carrierCompanyId);
    if (!company) return null;

    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_carrier_and_active", (q) =>
        q.eq("carrierCompanyId", company._id).eq("isActive", true)
      )
      .collect();

    const users = await ctx.db
      .query("carrierUsers")
      .withIndex("by_company_and_active", (q) =>
        q.eq("carrierCompanyId", company._id).eq("isActive", true)
      )
      .collect();

    return {
      _id: company._id,
      _creationTime: company._creationTime,
      name: company.name,
      code: company.code,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      email: company.email,
      isActive: company.isActive,
      preferredLanguage: company.preferredLanguage,
      notificationChannel: company.notificationChannel,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      truckCount: trucks.length,
      userCount: users.length,
    };
  },
});

/**
 * Get current user's carrier company
 */
export const getMyCompany = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("carrierCompanies"),
      name: v.string(),
      code: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      isActive: v.boolean(),
      isCompanyAdmin: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (!isCarrier(user) || !user.carrierCompanyId) {
      return null;
    }

    const company = await ctx.db.get(user.carrierCompanyId);
    if (!company) return null;

    return {
      _id: company._id,
      name: company.name,
      code: company.code,
      email: company.email,
      phone: company.phone,
      isActive: company.isActive,
      isCompanyAdmin: user.isCompanyAdmin,
    };
  },
});

/**
 * Get carrier company by code
 */
export const getByCode = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("carrierCompanies"),
      name: v.string(),
      code: v.string(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin"]);

    const company = await ctx.db
      .query("carrierCompanies")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!company) return null;

    return {
      _id: company._id,
      name: company.name,
      code: company.code,
      isActive: company.isActive,
    };
  },
});

/**
 * List users in a carrier company
 */
export const listUsers = query({
  args: { carrierCompanyId: v.id("carrierCompanies") },
  returns: v.array(
    v.object({
      userId: v.string(),
      isCompanyAdmin: v.boolean(),
      isActive: v.boolean(),
      joinedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check access
    if (!isPortAdmin(user)) {
      if (!isCarrier(user) || user.carrierCompanyId !== args.carrierCompanyId) {
        return [];
      }
    }

    const carrierUsers = await ctx.db
      .query("carrierUsers")
      .withIndex("by_company", (q) => q.eq("carrierCompanyId", args.carrierCompanyId))
      .collect();

    return carrierUsers.map((cu) => ({
      userId: cu.userId,
      isCompanyAdmin: cu.isCompanyAdmin,
      isActive: cu.isActive,
      joinedAt: cu.joinedAt,
    }));
  },
});
