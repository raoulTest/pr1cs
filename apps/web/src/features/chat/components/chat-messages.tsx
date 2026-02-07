"use client";

import { useEffect, useRef, useMemo } from "react";
import { ChatMessageItem, type ToolResultData } from "./chat-message-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { type MessageDoc } from "@convex-dev/agent";

interface ChatMessagesProps {
  messages: MessageDoc[];
  isLoading?: boolean;
  isStreaming?: boolean;
  suggestions?: string[];
  isSuggestionsLoading?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

// Tool result part structure from @convex-dev/agent
interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result?: unknown;
  output?: {
    type: "text" | "json" | "error-text" | "error-json" | "content";
    value: unknown;
  };
  isError?: boolean;
}

interface TextPart {
  type: "text";
  text: string;
}

interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

type ContentPart = ToolCallPart | ToolResultPart | TextPart | { type: string };

/**
 * Check if a message has tool calls
 */
function hasToolCalls(message: MessageDoc): boolean {
  const content = message.message?.content;
  if (!Array.isArray(content)) return false;
  return (content as ContentPart[]).some((part) => part.type === "tool-call");
}

/**
 * Check if a message has text content
 */
function hasTextContent(message: MessageDoc): boolean {
  const content = message.message?.content;
  if (typeof content === "string") return content.trim().length > 0;
  if (!Array.isArray(content)) return false;
  return (content as ContentPart[]).some(
    (part) => part.type === "text" && (part as TextPart).text?.trim().length > 0
  );
}

/**
 * Reorder messages so that text-only assistant messages appear before 
 * tool-call assistant messages within each assistant turn.
 * This makes the UI show: text first, then tool results.
 */
function reorderMessagesForDisplay(messages: MessageDoc[]): MessageDoc[] {
  const result: MessageDoc[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    const role = msg.message?.role;

    // If it's a user message, just add it
    if (role === "user") {
      result.push(msg);
      i++;
      continue;
    }

    // For assistant/tool messages, collect the entire "turn" 
    // (all consecutive non-user messages)
    const turnMessages: MessageDoc[] = [];
    while (i < messages.length && messages[i].message?.role !== "user") {
      turnMessages.push(messages[i]);
      i++;
    }

    // Separate into categories:
    // - Text-only assistant messages (no tool calls)
    // - Tool-related messages (has tool calls or is tool role)
    const textOnlyMessages: MessageDoc[] = [];
    const toolMessages: MessageDoc[] = [];

    for (const turnMsg of turnMessages) {
      const turnRole = turnMsg.message?.role;
      if (turnRole === "tool") {
        toolMessages.push(turnMsg);
      } else if (turnRole === "assistant") {
        if (hasToolCalls(turnMsg)) {
          toolMessages.push(turnMsg);
        } else if (hasTextContent(turnMsg)) {
          textOnlyMessages.push(turnMsg);
        } else {
          // Empty message, add to tool messages to preserve order
          toolMessages.push(turnMsg);
        }
      } else {
        toolMessages.push(turnMsg);
      }
    }

    // Add text-only messages first, then tool messages
    result.push(...textOnlyMessages, ...toolMessages);
  }

  return result;
}

/**
 * Build a map of toolCallId -> result from all tool role messages
 */
function buildToolResultsMap(messages: MessageDoc[]): Map<string, ToolResultData> {
  const resultsMap = new Map<string, ToolResultData>();

  for (const msg of messages) {
    const role = msg.message?.role;
    
    // Only process tool role messages
    if (role !== "tool") continue;
    
    const content = msg.message?.content;
    if (!Array.isArray(content)) continue;
    
    // Extract all tool-result parts
    for (const part of content) {
      if (part && typeof part === "object" && "type" in part && part.type === "tool-result") {
        const toolResult = part as ToolResultPart;
        if (toolResult.toolCallId) {
          const isError = toolResult.isError || 
            toolResult.output?.type === "error-text" || 
            toolResult.output?.type === "error-json";
          
          resultsMap.set(toolResult.toolCallId, {
            result: toolResult.result,
            output: toolResult.output,
            isError,
          });
        }
      }
    }
  }

  return resultsMap;
}

export function ChatMessages({
  messages,
  isLoading,
  isStreaming,
  suggestions,
  isSuggestionsLoading,
  onSuggestionClick,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build tool results map once from all messages
  const toolResultsMap = useMemo(() => buildToolResultsMap(messages), [messages]);

  // Reorder messages so text appears before tool calls
  const orderedMessages = useMemo(() => reorderMessagesForDisplay(messages), [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6"
    >
      {orderedMessages.map((message, index) => {
        const isLastMessage = index === orderedMessages.length - 1;
        const isStreamingThisMessage =
          isStreaming && isLastMessage && message.message?.role === "assistant";

        return (
          <ChatMessageItem
            key={message._id}
            message={message}
            isStreaming={isStreamingThisMessage}
            toolResultsMap={toolResultsMap}
          />
        );
      })}

      {/* Streaming indicator when waiting for first token */}
      {isStreaming &&
        messages.length > 0 &&
        messages[messages.length - 1].message?.role === "user" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Skeleton className="h-4 w-48" />
          </div>
        )}

      {/* Follow-up suggestions — only when not streaming */}
      {!isStreaming && onSuggestionClick && (
        isSuggestionsLoading ? (
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-10">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="mx-auto max-w-3xl px-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suggestions>
              {suggestions.map((s) => (
                <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
              ))}
            </Suggestions>
          </div>
        ) : null
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
