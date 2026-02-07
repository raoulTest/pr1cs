"use client";

import { useCallback, useState } from "react";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatEmptyState } from "./chat-empty-state";
import { type MessageDoc } from "@convex-dev/agent";

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface ChatViewProps {
  messages: MessageDoc[];
  isLoading?: boolean;
  status?: ChatStatus;
  onSendMessage: (message: string) => void | Promise<void>;
  onStop?: () => void;
}

export function ChatView({
  messages,
  isLoading,
  status,
  onSendMessage,
  onStop,
}: ChatViewProps) {
  const [_inputValue, setInputValue] = useState("");

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      onSendMessage(suggestion);
    },
    [onSendMessage],
  );

  const handleSubmit = useCallback(
    async (message: string) => {
      setInputValue("");
      await onSendMessage(message);
    },
    [onSendMessage],
  );

  const hasMessages = messages.length > 0;
  const isStreaming = status === "streaming";

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
          />
        ) : (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSubmit={handleSubmit} status={status} onStop={onStop} />
        </div>
      </div>
    </div>
  );
}
