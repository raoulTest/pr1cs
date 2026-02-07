/**
 * Booking Flow Tools
 *
 * Tools for AI agent to create and manage bookings.
 * These are mutation tools that modify data.
 */
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "../../_generated/api";
import { checkToolAccess } from "./types";

// ============================================================================
// MUTATION TOOLS
// ============================================================================

/**
 * Create a booking via AI assistant.
 * Returns confirmation card with status (auto-validated or pending).
 * Frontend component: <BookingConfirmation />
 */
export const createBookingViaAI = createTool({
  description:
    "Crée une réservation pour le transporteur. Retourne une confirmation " +
    "avec le statut (auto-validé si sous le seuil, sinon en attente de validation). " +
    "Nécessite: terminal, camion, conteneurs, date et créneau horaire.",
  args: z.object({
    terminalCode: z
      .string()
      .describe("Code du terminal (ex: 'TRM-001')"),
    licensePlate: z
      .string()
      .describe("Plaque d'immatriculation du camion"),
    containerNumbers: z
      .array(z.string())
      .describe("Numéros des conteneurs à transporter"),
    date: z
      .string()
      .describe("Date de la réservation (format YYYY-MM-DD)"),
    startTime: z
      .string()
      .describe("Heure de début du créneau (format HH:mm, ex: '09:00')"),
    endTime: z
      .string()
      .describe("Heure de fin du créneau (format HH:mm, ex: '10:00')"),
    driverName: z
      .string()
      .optional()
      .describe("Nom du chauffeur"),
    driverPhone: z
      .string()
      .optional()
      .describe("Téléphone du chauffeur"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "createBookingViaAI");
    if (denied) return denied;

    return await ctx.runMutation(internal.ai.mutations.createBookingFromAI, {
      userId: ctx.userId!,
      terminalCode: args.terminalCode,
      licensePlate: args.licensePlate,
      containerNumbers: args.containerNumbers,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      driverName: args.driverName,
      driverPhone: args.driverPhone,
    });
  },
});

/**
 * Cancel a booking via AI assistant.
 * Frontend component: <CancellationConfirmation />
 */
export const cancelBookingViaAI = createTool({
  description:
    "Annule une réservation existante. Les transporteurs peuvent annuler " +
    "leurs propres réservations à tout moment avant consommation.",
  args: z.object({
    bookingReference: z
      .string()
      .describe("Référence de la réservation (ex: 'TRM1-BK-001234')"),
    reason: z
      .string()
      .optional()
      .describe("Raison de l'annulation (optionnel)"),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    const denied = await checkToolAccess(ctx, "cancelBookingViaAI");
    if (denied) return denied;

    return await ctx.runMutation(internal.ai.mutations.cancelBookingFromAI, {
      userId: ctx.userId!,
      bookingReference: args.bookingReference.toUpperCase().trim(),
      reason: args.reason,
    });
  },
});
