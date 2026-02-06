/**
 * Tool Registry
 *
 * Central registry of all agent tools. Provides role-based filtering
 * so the agent only sees tools the current user is allowed to use.
 *
 * To add a new tool:
 * 1. Create the tool in the appropriate file under ./tools/
 * 2. Import and add it to ALL_TOOLS below
 * 3. Add the tool name to TOOL_PERMISSIONS in ./tools/types.ts for the appropriate roles
 * 4. (Optional) Add the corresponding internal query in ./internalQueries.ts
 */
import type { ApcsRole } from "../lib/validators";
import { getToolNamesForRole } from "./tools/types";

// Import all tools
import {
  listMyBookings,
  getBookingDetails,
  listBookingsByTerminal,
  listBookingsByCarrier,
  listPendingBookings,
} from "./tools/bookings";
import {
  listTerminals,
  getTerminalDetails,
  getAvailableSlots,
} from "./tools/terminals";
import { getSystemConfig } from "./tools/config";

// ============================================================================
// ALL TOOLS (name -> tool)
// ============================================================================

/**
 * Complete map of every tool in the system.
 * Keys must match what's in TOOL_PERMISSIONS.
 */
export const ALL_TOOLS = {
  listMyBookings,
  getBookingDetails,
  listBookingsByTerminal,
  listBookingsByCarrier,
  listPendingBookings,
  listTerminals,
  getTerminalDetails,
  getAvailableSlots,
  getSystemConfig,
} as const;

export type ToolName = keyof typeof ALL_TOOLS;

// ============================================================================
// ROLE-BASED FILTERING
// ============================================================================

/**
 * Return only the tools the given role can access.
 * This is passed to the agent when starting a conversation.
 */
export function getToolsForRole(role: ApcsRole): Record<string, (typeof ALL_TOOLS)[ToolName]> {
  const allowed = getToolNamesForRole(role);
  const filtered: Record<string, (typeof ALL_TOOLS)[ToolName]> = {};

  for (const name of allowed) {
    if (name in ALL_TOOLS) {
      filtered[name] = ALL_TOOLS[name as ToolName];
    }
  }

  return filtered;
}
