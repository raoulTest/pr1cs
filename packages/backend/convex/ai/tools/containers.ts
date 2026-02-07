/**
 * Container Tools
 *
 * Tools for AI agent to query and display container data.
 * Carriers can list their own containers and get details.
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess } from "./types";

// ============================================================================
// QUERY TOOLS
// ============================================================================

/**
 * List the current user's containers.
 * Frontend component: <ContainerList />
 */
export const listMyContainers = createTool({
  description:
    "Liste les conteneurs du transporteur. Peut filtrer par type d'opération " +
    "(enlèvement/dépôt) ou disponibilité (non assignés à une réservation).",
  args: z.object({
    operationType: z
      .enum(["pick_up", "drop_off"])
      .optional()
      .describe("Filtrer par type d'opération: 'pick_up' (enlèvement) ou 'drop_off' (dépôt)"),
    availableOnly: z
      .boolean()
      .optional()
      .describe("Uniquement les conteneurs non assignés à une réservation (défaut: true)"),
    limit: z
      .number()
      .optional()
      .describe("Nombre maximum de résultats (défaut 50)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listMyContainers");
    if (denied) return denied;

    return await ctx.runQuery(internal.ai.internalQueries.listMyContainers, {
      userId: ctx.userId!,
      operationType: args.operationType,
      availableOnly: args.availableOnly ?? true,
      limit: args.limit ?? 50,
    });
  },
});

/**
 * Get full details of a single container.
 * Frontend component: <ContainerCard />
 */
export const getContainerDetails = createTool({
  description:
    "Obtient les détails complets d'un conteneur spécifique par son numéro " +
    "(ex: 'MSCU1234567'). Retourne type, dimensions, statut, dates, etc.",
  args: z.object({
    containerNumber: z
      .string()
      .describe("Le numéro du conteneur (ex: 'MSCU1234567')"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "getContainerDetails");
    if (denied) return denied;

    return await ctx.runQuery(
      internal.ai.internalQueries.getContainerByNumber,
      {
        userId: ctx.userId!,
        containerNumber: args.containerNumber.toUpperCase().trim(),
      },
    );
  },
});

/**
 * List the current user's trucks.
 * Frontend component: <TruckList />
 */
export const listMyTrucks = createTool({
  description:
    "Liste les camions du transporteur. Peut filtrer par statut actif.",
  args: z.object({
    activeOnly: z
      .boolean()
      .optional()
      .describe("Uniquement les camions actifs (défaut: true)"),
    limit: z
      .number()
      .optional()
      .describe("Nombre maximum de résultats (défaut 50)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "listMyTrucks");
    if (denied) return denied;

    return await ctx.runQuery(internal.ai.internalQueries.listMyTrucks, {
      userId: ctx.userId!,
      activeOnly: args.activeOnly ?? true,
      limit: args.limit ?? 50,
    });
  },
});
