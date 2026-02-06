"use node";
/**
 * Chat Actions
 *
 * Entry points for the AI assistant. Handles thread creation
 * and message streaming.
 *
 * Role-based access control is handled inside each tool handler,
 * not at the action level — so these actions are simple pass-throughs.
 */
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { apcsAgent } from "./agent";
import { getToolNamesForRole } from "./tools/types";
import type { ApcsRole } from "../lib/validators";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build user context string with role and available tools.
 * This is prepended to the user's prompt so the AI knows what it can suggest.
 */
function buildUserContext(role: ApcsRole | null): string {
  if (!role) {
    return "USER CONTEXT:\n" +
      "- Role: unknown (no role assigned)\n" +
      "- Available Tools: none\n" +
      "- Guidelines: The user has no assigned role. Inform them to contact an administrator.\n\n";
  }

  const availableTools = getToolNamesForRole(role);
  const toolDescriptions: Record<string, string> = {
    listMyBookings: "List the user's own bookings",
    getBookingDetails: "Get details of a specific booking",
    listBookingsByTerminal: "List bookings for a specific terminal (terminal_operator and port_admin only)",
    listBookingsByCarrier: "List bookings for a specific carrier (port_admin only)",
    listPendingBookings: "List pending bookings awaiting approval (terminal_operator and port_admin only)",
    listTerminals: "List all terminals",
    getTerminalDetails: "Get detailed information about a terminal",
    getAvailableSlots: "Get available time slots for booking",
    getSystemConfig: "Get system configuration and policies",
  };

  let toolList = "";
  for (const tool of availableTools) {
    const desc = toolDescriptions[tool] || "No description";
    toolList += "- " + tool + ": " + desc + "\n";
  }

  return "USER CONTEXT:\n" +
    "- Role: " + role + "\n" +
    "- Available Tools:\n" + toolList +
    "- Guidelines: Only suggest using the available tools listed above. If the user asks for functionality requiring a tool not in this list, politely explain that their role (" + role + ") doesn't have access to that feature.\n\n";
}

// ============================================================================
// THREAD MANAGEMENT (Actions — need Node.js for agent SDK)
// ============================================================================

/**
 * Create a new conversation thread.
 * Called from the frontend when the user starts a new chat.
 */
export const createThread = action({
  args: {
    userId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { threadId } = await apcsAgent.createThread(ctx, {
      userId: args.userId,
      title: "New Conversation",
    });

    return threadId;
  },
});

// ============================================================================
// STREAMING CHAT
// ============================================================================

/**
 * Initiate a streaming chat response.
 *
 * This action kicks off the agent. The frontend subscribes to
 * `listThreadMessages` query to see the streamed response in real time.
 */
export const initiateStream = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Fetch user role and build context
    const profile = await ctx.runQuery(
      internal.ai.internalQueries.getUserRole,
      { userId: args.userId },
    );
    const role = profile?.apcsRole as ApcsRole | null;
    const context = buildUserContext(role);
    const fullPrompt = context + "USER MESSAGE: " + args.prompt;

    // Stream text — deltas are saved to the component's messages table
    // so the frontend query picks them up in real time.
    // Tools are defined on the agent; each tool checks the user's role internally.
    await apcsAgent.streamText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      { prompt: fullPrompt },
      { saveStreamDeltas: true },
    );

    return null;
  },
});

/**
 * Send a non-streaming message (simpler, for quick responses).
 */
export const generateResponse = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    userId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Fetch user role and build context
    const profile = await ctx.runQuery(
      internal.ai.internalQueries.getUserRole,
      { userId: args.userId },
    );
    const role = profile?.apcsRole as ApcsRole | null;
    const context = buildUserContext(role);
    const fullPrompt = context + "USER MESSAGE: " + args.prompt;

    const result = await apcsAgent.generateText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      { prompt: fullPrompt },
    );

    return result.text;
  },
});
