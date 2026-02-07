"use client";

import { useCallback, useState } from "react";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatEmptyState } from "./chat-empty-state";
import { type MessageDoc } from "@convex-dev/agent";
import {
  ToolUIProvider,
  ToolExpandSheet,
  ConfirmationDialog,
} from "@/features/tools";

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface ChatViewProps {
  messages: MessageDoc[];
  isLoading?: boolean;
  status?: ChatStatus;
  suggestions?: string[];
  isSuggestionsLoading?: boolean;
  onSendMessage: (message: string) => void | Promise<void>;
  onStop?: () => void;
}

export function ChatView({
  messages,
  isLoading,
  status,
  suggestions,
  isSuggestionsLoading,
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

  // Wrapper for onSendMessage to convert Promise<void> to void
  const handleSendMessage = useCallback(
    (message: string) => {
      void onSendMessage(message);
    },
    [onSendMessage],
  );

  const hasMessages = messages.length > 0;
  const isStreaming = status === "streaming";

  return (
    <ToolUIProvider onSendMessage={handleSendMessage}>
      <div className="flex h-full flex-col">
        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          {hasMessages ? (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              suggestions={suggestions}
              isSuggestionsLoading={isSuggestionsLoading}
              onSuggestionClick={handleSuggestionClick}
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

      {/* Global Tool UI components */}
      <ToolExpandSheet />
      <ConfirmationDialog />
    </ToolUIProvider>
  );
}
