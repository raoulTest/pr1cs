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
import { internal, components } from "../_generated/api";
import { apcsAgent } from "./agent";
import { getToolNamesForRole } from "./tools/types";
import type { ApcsRole } from "../lib/validators";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build user context string with role and available tools.
 * This is prepended to the user's prompt so the AI knows what it can suggest.
 */
function buildUserContext(role: ApcsRole | null): string {
  if (!role) {
    return (
      "USER CONTEXT:\n" +
      "- Role: unknown (no role assigned)\n" +
      "- Available Tools: none\n" +
      "- Guidelines: The user has no assigned role. Inform them to contact an administrator.\n\n"
    );
  }

  const availableTools = getToolNamesForRole(role);
  const toolDescriptions: Record<string, string> = {
    listMyBookings: "List the user's own bookings",
    getBookingDetails: "Get details of a specific booking",
    listBookingsByTerminal:
      "List bookings for a specific terminal (terminal_operator and port_admin only)",
    listBookingsByCarrier:
      "List bookings for a specific carrier (port_admin only)",
    listPendingBookings:
      "List pending bookings awaiting approval (terminal_operator and port_admin only)",
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

  return (
    "USER CONTEXT:\n" +
    "- Role: " +
    role +
    "\n" +
    "- Available Tools:\n" +
    toolList +
    "- Guidelines: Only suggest using the available tools listed above. If the user asks for functionality requiring a tool not in this list, politely explain that their role (" +
    role +
    ") doesn't have access to that feature.\n\n"
  );
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
      title: "", // Empty, will be set after first message by generateThreadTitle
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
    const role = profile?.role as ApcsRole | null;
    const context = buildUserContext(role);

    // Stream text — deltas are saved to the component's messages table
    // so the frontend query picks them up in real time.
    // Tools are defined on the agent; each tool checks the user's role internally.
    // Use system parameter for context to keep user message clean in chat bubbles
    await apcsAgent.streamText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      {
        prompt: args.prompt, // Original prompt only
        system: context, // Context as system message
      },
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
    const role = profile?.role as ApcsRole | null;
    const context = buildUserContext(role);

    // Use system parameter for context to keep user message clean
    const result = await apcsAgent.generateText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      {
        prompt: args.prompt, // Original prompt only
        system: context, // Context as system message
      },
    );

    return result.text;
  },
});

// ============================================================================
// THREAD TITLE GENERATION
// ============================================================================

/**
 * Generate a title for a thread based on the first message.
 * Called asynchronously after the first message is sent.
 */
export const generateThreadTitle = action({
  args: {
    threadId: v.string(),
    firstMessage: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: google("gemini-3-flash-preview"),
      prompt: `Generate a very short title (max 5 words, in French) for a conversation that starts with this message: "${args.firstMessage}". Return only the title, no quotes or punctuation.`,
      maxOutputTokens: 20,
    });

    const title = text.trim();

    // Update thread title using the component's internal mutation
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: args.threadId,
      patch: { title },
    });

    return title;
  },
});
