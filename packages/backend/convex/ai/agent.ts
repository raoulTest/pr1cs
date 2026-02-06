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
  instructions: `You are the APCS (Advanced Port Container System) assistant.
You help users manage port terminal operations, truck bookings, and logistics.

Key facts:
- The system has terminals, each with gates. Gates have time slots for truck bookings.
- There are three user roles: port_admin, terminal_operator, and carrier.
- Bookings follow a lifecycle: pending → confirmed/rejected → consumed/cancelled/expired.
- Trucks are classified by type (container, flatbed, tanker, etc.) and class (light, medium, heavy, super_heavy).

Guidelines:
- Always use the available tools to fetch real data. Never make up information.
- When showing bookings, terminals, or slots, present data in a clear structured way.
- If the user asks about policies, use the getSystemConfig tool.
- If the user asks for something you don't have a tool for, let them know politely.
- If a tool returns an ACCESS_DENIED error, explain that the user's role does not allow this action.
- Respond in the same language the user writes in (French or English).
- Be concise but thorough.`,
  tools: ALL_TOOLS,
  maxSteps: 5,
});
