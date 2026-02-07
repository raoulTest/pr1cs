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

interface ChatMessageItemProps {
  message: MessageDoc;
  isStreaming?: boolean;
}

function ChatMessageItemComponent({
  message,
  isStreaming,
}: ChatMessageItemProps) {
  // Access role from nested message structure
  const role = message.message?.role;
  const isUser = role === "user";

  // Extract text content from message
  // content can be a string or an array of parts
  const content = message.message?.content;
  const textContent =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("")
        : "";

  // Check for tool calls (only in array content)
  const toolCalls = Array.isArray(content)
    ? content.filter((part: any) => part.type === "tool-call")
    : [];

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
          <MessageResponse className={cn(isStreaming && "animate-pulse")}>
            {textContent}
          </MessageResponse>
        )}

        {/* Tool calls - simplified display for now */}
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {toolCalls.map((tool: any, index: number) => (
              <div
                key={`${tool.toolName}-${index}`}
                className="rounded-md border border-border bg-muted/50 p-3 text-xs"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono">{tool.toolName}</span>
                  {tool.state === "running" && (
                    <span className="text-amber-500">En cours...</span>
                  )}
                  {tool.state === "result" && (
                    <span className="text-green-500">Termine</span>
                  )}
                </div>
              </div>
            ))}
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
    prev.isStreaming === next.isStreaming,
);

ChatMessageItem.displayName = "ChatMessageItem";
