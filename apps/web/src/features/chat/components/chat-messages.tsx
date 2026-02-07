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
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
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
