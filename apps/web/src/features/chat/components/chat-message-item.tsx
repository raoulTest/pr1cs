"use client";

import { memo } from "react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { BotIcon, UserIcon } from "lucide-react";
import { type MessageDoc } from "@convex-dev/agent";
import { ToolCallRenderer } from "@/features/tools";

interface ChatMessageItemProps {
  message: MessageDoc;
  isStreaming?: boolean;
  /** Map of toolCallId -> result from tool role messages */
  toolResultsMap?: Map<string, ToolResultData>;
}

// Tool call part (in assistant message)
interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

// Tool result part (in assistant or tool role message)
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

type ContentPart = ToolCallPart | ToolResultPart | TextPart | { type: string };

// Data structure for tool results
export interface ToolResultData {
  result?: unknown;
  output?: ToolResultPart["output"];
  isError?: boolean;
}

/**
 * Extract the actual result value from a tool result part
 */
function extractResultValue(part: ToolResultPart): unknown {
  // First check output field (new format)
  if (part.output) {
    return part.output.value;
  }
  // Fallback to result field (legacy format)
  return part.result;
}

/**
 * Check if a tool result has an error
 */
function isToolError(part: ToolResultPart): boolean {
  if (part.isError) return true;
  if (part.output?.type === "error-text" || part.output?.type === "error-json") {
    return true;
  }
  return false;
}

/**
 * Check if a tool result has the `_display` wrapper and extract the flag.
 * Returns { display, data } if wrapped, or null if not wrapped.
 */
function unwrapDisplayResult(value: unknown): {
  display: boolean;
  data: unknown;
} | null {
  if (
    value &&
    typeof value === "object" &&
    "_display" in value &&
    "data" in value
  ) {
    const wrapped = value as { _display: boolean; data: unknown };
    return { display: wrapped._display, data: wrapped.data };
  }
  return null;
}

function ChatMessageItemComponent({
  message,
  isStreaming: _isStreaming,
  toolResultsMap,
}: ChatMessageItemProps) {
  // Access role from nested message structure
  const role = message.message?.role;
  const isUser = role === "user";
  const isTool = role === "tool";

  // Skip tool role messages - they are handled by matching with tool calls
  if (isTool) {
    return null;
  }

  // Extract text content from message
  // content can be a string or an array of parts
  const content = message.message?.content;
  const textContent =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? (content as ContentPart[])
            .filter((part): part is TextPart => part.type === "text")
            .map((part) => part.text)
            .join("")
        : "";

  // Extract tool calls from assistant messages
  const toolCalls = Array.isArray(content)
    ? (content as ContentPart[]).filter(
        (part): part is ToolCallPart => part.type === "tool-call"
      )
    : [];

  // Extract tool results that are inline in the same message (some providers do this)
  const inlineToolResults = Array.isArray(content)
    ? (content as ContentPart[]).filter(
        (part): part is ToolResultPart => part.type === "tool-result"
      )
    : [];

  // Build a map of inline results by toolCallId
  const inlineResultsMap = new Map<string, ToolResultPart>();
  for (const result of inlineToolResults) {
    if (result.toolCallId) {
      inlineResultsMap.set(result.toolCallId, result);
    }
  }

  if (!textContent && toolCalls.length === 0) {
    return null;
  }

  return (
    <Message from={isUser ? "user" : "assistant"}>
      {/* Avatar */}
      <div
        className={cn("flex items-center gap-2", isUser && "flex-row-reverse")}
      >
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? (
            <UserIcon className="size-4" />
          ) : (
            <BotIcon className="size-4" />
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {isUser ? "Vous" : "APCS Assistant"}
        </span>
      </div>

      {/* Message content */}
      <MessageContent>
        {textContent && (
          <MessageResponse>
            {textContent}
          </MessageResponse>
        )}

        {/* Tool calls - using proper renderers */}
        {toolCalls.length > 0 && (
          <div className="mt-3 space-y-3">
            {toolCalls.map((tool) => {
              // Look for result in order:
              // 1. Inline results in the same message
              // 2. Results from tool role messages (passed via toolResultsMap)
              const inlineResult = inlineResultsMap.get(tool.toolCallId);
              const externalResult = toolResultsMap?.get(tool.toolCallId);

              let state: "running" | "result" | "error" = "running";
              let result: unknown = undefined;
              let error: string | undefined = undefined;

              if (inlineResult) {
                // Inline result found
                if (isToolError(inlineResult)) {
                  state = "error";
                  error = String(extractResultValue(inlineResult) || "Une erreur est survenue");
                } else {
                  state = "result";
                  result = extractResultValue(inlineResult);
                }
              } else if (externalResult) {
                // External result from tool role message
                if (externalResult.isError) {
                  state = "error";
                  const errorValue = externalResult.output?.value ?? externalResult.result;
                  error = String(errorValue || "Une erreur est survenue");
                } else {
                  state = "result";
                  result = externalResult.output?.value ?? externalResult.result;
                }
              }

              // Check for _display wrapper and skip hidden tool calls
              if (state === "result" && result != null) {
                const unwrapped = unwrapDisplayResult(result);
                if (unwrapped) {
                  if (unwrapped.display === false) {
                    return null; // Hidden tool call — don't render
                  }
                  result = unwrapped.data; // Unwrap for the renderer
                }
              }

              return (
                <ToolCallRenderer
                  key={tool.toolCallId}
                  toolName={tool.toolName}
                  toolCallId={tool.toolCallId}
                  args={tool.args || {}}
                  result={result}
                  state={state}
                  error={error}
                />
              );
            })}
          </div>
        )}
      </MessageContent>
    </Message>
  );
}

export const ChatMessageItem = memo(
  ChatMessageItemComponent,
  (prev, next) =>
    prev.message._id === next.message._id &&
    prev.message.text === next.message.text &&
    prev.isStreaming === next.isStreaming &&
    prev.toolResultsMap === next.toolResultsMap,
);

ChatMessageItem.displayName = "ChatMessageItem";
