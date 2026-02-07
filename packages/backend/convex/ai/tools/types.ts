/**
 * Tool Type Definitions
 *
 * Shared types for the AI tool system.
 * Each tool returns a typed result that the frontend can render
 * with a dedicated component.
 */
import type { ApcsRole } from "../../lib/validators";
import { internal } from "../../_generated/api";

// ============================================================================
// ROLE-BASED TOOL ACCESS
// ============================================================================

/**
 * Maps each role to the tool names it can access.
 * Add new tools here when you create them.
 *
 * - carrier: booking / truck / terminal viewing, slot availability, booking creation
 * - terminal_operator: everything a carrier can do + terminal management (no booking creation)
 * - port_admin: everything
 */
export const TOOL_PERMISSIONS: Record<ApcsRole, readonly string[]> = {
  carrier: [
    // Booking queries
    "listMyBookings",
    "getBookingDetails",
    // Terminal queries
    "listTerminals",
    "getTerminalDetails",
    "getAvailableSlots",
    // Config
    "getSystemConfig",
    // Container & Truck queries
    "listMyContainers",
    "getContainerDetails",
    "listMyTrucks",
    // Suggestions
    "suggestOptimalSlots",
    // Booking mutations (carriers only)
    "createBookingViaAI",
    "cancelBookingViaAI",
  ] as const,
  terminal_operator: [
    // Booking queries
    "listMyBookings",
    "getBookingDetails",
    "listBookingsByTerminal",
    "listPendingBookings",
    // Terminal queries
    "listTerminals",
    "getTerminalDetails",
    "getAvailableSlots",
    // Config
    "getSystemConfig",
    // Container & Truck queries
    "listMyContainers",
    "getContainerDetails",
    "listMyTrucks",
    // Suggestions
    "suggestOptimalSlots",
  ] as const,
  port_admin: [
    // Booking queries
    "listMyBookings",
    "getBookingDetails",
    "listBookingsByTerminal",
    "listBookingsByCarrier",
    "listPendingBookings",
    // Terminal queries
    "listTerminals",
    "getTerminalDetails",
    "getAvailableSlots",
    // Config
    "getSystemConfig",
    // Container & Truck queries
    "listMyContainers",
    "getContainerDetails",
    "listMyTrucks",
    // Suggestions
    "suggestOptimalSlots",
  ] as const,
};

/**
 * Check if a role has access to a specific tool.
 */
export function canAccessTool(role: ApcsRole, toolName: string): boolean {
  return TOOL_PERMISSIONS[role]?.includes(toolName) ?? false;
}

/**
 * Get the list of tool names available for a role.
 */
export function getToolNamesForRole(role: ApcsRole): readonly string[] {
  return TOOL_PERMISSIONS[role] ?? [];
}

// ============================================================================
// TOOL-LEVEL ROLE GUARD
// ============================================================================

/**
 * Result returned when the user's role is not allowed to use a tool.
 */
export interface AccessDeniedResult {
  error: "ACCESS_DENIED";
  message: string;
}

/**
 * Check the caller's role inside a tool handler and return an
 * AccessDeniedResult if they are not allowed.
 *
 * Usage:
 * ```ts
 * const denied = await checkToolAccess(ctx, "listPendingBookings");
 * if (denied) return denied;
 * ```
 */
export async function checkToolAccess(
  ctx: { runQuery: (...args: any[]) => Promise<any>; userId?: string },
  toolName: string,
): Promise<AccessDeniedResult | null> {
  if (!ctx.userId) {
    return {
      error: "ACCESS_DENIED",
      message: "You must be logged in to use this tool.",
    };
  }

  const profile = await ctx.runQuery(
    internal.ai.internalQueries.getUserRole,
    { userId: ctx.userId },
  );

  const role = profile?.role as ApcsRole | null;
  if (!role) {
    return {
      error: "ACCESS_DENIED",
      message: "Your account has no assigned role. Contact an administrator.",
    };
  }

  if (!canAccessTool(role, toolName)) {
    return {
      error: "ACCESS_DENIED",
      message: `Your role (${role}) does not have access to this functionality.`,
    };
  }

  return null; // access granted
}
