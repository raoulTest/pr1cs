"use client";

import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

interface ChatInputProps {
  onSubmit: (message: string) => void | Promise<void>;
  status?: ChatStatus;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  status,
  onStop,
  disabled,
  placeholder = "Tapez votre message...",
}: ChatInputProps) {
  const handleSubmit = async (message: { text: string; files: unknown[] }) => {
    if (!message.text.trim()) return;
    await onSubmit(message.text);
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <PromptInput onSubmit={handleSubmit} className="w-full">
      <PromptInputTextarea
        placeholder={placeholder}
        disabled={disabled || isLoading}
      />
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit
          status={status}
          onStop={onStop}
          disabled={disabled}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
