"use client";

import { useEffect, useRef } from "react";
import { ChatMessageItem } from "./chat-message-item";
import { Skeleton } from "@/components/ui/skeleton";
import { type MessageDoc } from "@convex-dev/agent";

interface ChatMessagesProps {
  messages: MessageDoc[];
  isLoading?: boolean;
  isStreaming?: boolean;
}

export function ChatMessages({
  messages,
  isLoading,
  isStreaming,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div ref={messagesEndRef} />
    </div>
  );
}
