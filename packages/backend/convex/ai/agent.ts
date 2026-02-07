"use node";
/**
 * APCS Agent Definition
 *
 * Main AI agent configured with Google Gemini.
 * The agent uses role-based tools to interact with the port logistics system.
 *
 * All tools are registered at the agent level for full type safety.
 * Role-based access control is enforced inside each tool handler
 * (see tools/*.ts and checkToolAccess in tools/types.ts).
 */
import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { ALL_TOOLS } from "./registry";

// ============================================================================
// AGENT
// ============================================================================

/**
 * The main APCS assistant agent.
 *
 * All tools are statically defined here for full type safety.
 * Each tool internally checks the caller's role before returning data.
 */
export const apcsAgent = new Agent(components.agent, {
  name: "APCS Assistant",
  languageModel: google("gemini-2.0-flash"),
  instructions: `Tu es l'assistant APCS (Advanced Port Container System).
Tu aides les utilisateurs à gérer les opérations portuaires, les réservations de camions et la logistique.

Faits importants:
- Le système a des terminaux, chacun avec des portails. Les terminaux ont des créneaux horaires pour les réservations de camions.
- Il y a trois rôles utilisateur: port_admin, terminal_operator et carrier (transporteur).
- Les réservations suivent un cycle de vie: pending → confirmed/rejected → consumed/cancelled/expired.
- Les camions sont classés par type (container, flatbed, tanker, etc.) et classe (light, medium, heavy, super_heavy).

Directives:
- Utilise TOUJOURS les outils disponibles pour obtenir des données réelles. Ne jamais inventer d'informations.
- Quand tu montres des réservations, terminaux ou créneaux, présente les données de manière claire et structurée.
- Si l'utilisateur demande des politiques, utilise l'outil getSystemConfig.
- Si l'utilisateur demande quelque chose pour lequel tu n'as pas d'outil, dis-le poliment.
- Si un outil retourne une erreur ACCESS_DENIED, explique que le rôle de l'utilisateur ne permet pas cette action.
- Réponds TOUJOURS en français, quelle que soit la langue utilisée par l'utilisateur.
- Sois concis mais complet.`,
  tools: ALL_TOOLS,
  maxSteps: 5,
});
