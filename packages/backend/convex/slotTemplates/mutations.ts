/**
 * SlotTemplates Mutations
 *
 * Mutations for managing weekly recurring slot templates.
 * Templates are created automatically when a terminal is created (168 rows = 7 days × 24 hours).
 * Only update and bulkUpdate are exposed - no create/delete since templates are managed via terminal creation.
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getAuthenticatedUser,
  requireRole,
  requireTerminalAccess,
} from "../lib/permissions";

/**
 * Update a single slot template
 */
export const update = mutation({
  args: {
    templateId: v.id("slotTemplates"),
    maxCapacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Template introuvable",
      });
    }

    await requireTerminalAccess(ctx, user, template.terminalId);

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.maxCapacity !== undefined) {
      if (args.maxCapacity < 1) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "La capacité doit être au moins 1",
        });
      }
      updates.maxCapacity = args.maxCapacity;
    }
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.templateId, updates);
    return null;
  },
});

/**
 * Bulk update multiple slot templates
 * Allows changing capacity and/or active status for multiple templates at once
 */
export const bulkUpdate = mutation({
  args: {
    templateIds: v.array(v.id("slotTemplates")),
    maxCapacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.object({ updated: v.number(), failed: v.number() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, ["port_admin", "terminal_operator"]);

    if (args.templateIds.length === 0) {
      return { updated: 0, failed: 0 };
    }

    if (args.maxCapacity !== undefined && args.maxCapacity < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "La capacité doit être au moins 1",
      });
    }

    let updated = 0;
    let failed = 0;
    const now = Date.now();

    for (const templateId of args.templateIds) {
      const template = await ctx.db.get(templateId);
      if (!template) {
        failed++;
        continue;
      }

      try {
        await requireTerminalAccess(ctx, user, template.terminalId);
      } catch {
        failed++;
        continue;
      }

      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.maxCapacity !== undefined) {
        updates.maxCapacity = args.maxCapacity;
      }
      if (args.isActive !== undefined) {
        updates.isActive = args.isActive;
      }

      await ctx.db.patch(templateId, updates);
      updated++;
    }

    return { updated, failed };
  },
});
