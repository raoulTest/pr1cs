/**
 * Suggestion Tools
 *
 * Tools for AI agent to suggest optimal booking slots.
 * Uses load balancing and container urgency to recommend best times.
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess, toolResult, displayArg } from "./types";

// ============================================================================
// SUGGESTION TOOLS
// ============================================================================

/**
 * Suggest optimal time slots for a booking.
 * Takes into account load balancing, container urgency, and wait times.
 * Frontend component: <SlotSuggestions />
 */
export const suggestOptimalSlots = createTool({
  description:
    "Suggère les 5 meilleurs créneaux horaires pour une réservation. " +
    "Prend en compte: équilibrage de charge du terminal, urgence des conteneurs " +
    "(dates limites), et temps d'attente estimé.",
  args: z.object({
    terminalCode: z
      .string()
      .describe("Code du terminal (ex: 'TRM-001')"),
    containerNumbers: z
      .array(z.string())
      .optional()
      .describe("Numéros des conteneurs à transporter (pour calcul d'urgence)"),
    preferredDate: z
      .string()
      .optional()
      .describe("Date préférée au format YYYY-MM-DD (défaut: aujourd'hui)"),
    daysToCheck: z
      .number()
      .optional()
      .describe("Nombre de jours à vérifier (défaut: 3, max: 7)"),
    ...displayArg,
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "suggestOptimalSlots");
    if (denied) return denied;

    const data = await ctx.runQuery(
      internal.ai.internalQueries.suggestOptimalSlots,
      {
        userId: ctx.userId!,
        terminalCode: args.terminalCode,
        containerNumbers: args.containerNumbers,
        preferredDate: args.preferredDate,
        daysToCheck: Math.min(args.daysToCheck ?? 3, 7),
      },
    );
    return toolResult(data, args._display ?? true);
  },
});
