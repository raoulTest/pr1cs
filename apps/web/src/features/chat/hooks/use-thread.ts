import { useState, useCallback, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { type MessageDoc } from "@convex-dev/agent";

interface UseThreadOptions {
  userId: string;
  threadId?: string;
}

interface UseThreadReturn {
  threadId: string | undefined;
  messages: MessageDoc[];
  isLoading: boolean;
  isStreaming: boolean;
  status: "ready" | "submitted" | "streaming" | "error";
  suggestions: string[];
  isSuggestionsLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  createThread: () => Promise<string>;
  stop: () => void;
}

/**
 * Hook for managing a chat thread with the AI assistant.
 * Handles thread creation, message sending, and real-time streaming.
 */
export function useThread({
  userId,
  threadId: initialThreadId,
}: UseThreadOptions): UseThreadReturn {
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<
    "ready" | "submitted" | "streaming" | "error"
  >("ready");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Ref to access latest messages in callbacks
  const messagesRef = useRef<MessageDoc[]>([]);

  // Sync threadId state with prop changes (for navigation)
  useEffect(() => {
    setThreadId(initialThreadId);
  }, [initialThreadId]);

  // Actions
  const createThreadAction = useAction(api.ai.chat.createThread);
  const initiateStreamAction = useAction(api.ai.chat.initiateStream);
  const generateFollowUpsAction = useAction(api.ai.chat.generateFollowUps);

  // Query for messages - reactive subscription for real-time updates
  const messagesResult = useQuery(
    api.ai.queries.listThreadMessages,
    threadId
      ? {
          threadId,
          paginationOpts: { numItems: 50, cursor: null },
        }
      : "skip",
  );

  const messages = ([...(messagesResult?.page ?? [])].reverse()) as unknown as MessageDoc[];
  const isLoading = messagesResult === undefined;

  // Keep messagesRef in sync with messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const createThread = useCallback(async (): Promise<string> => {
    const newThreadId = await createThreadAction({ userId });
    setThreadId(newThreadId);
    return newThreadId;
  }, [createThreadAction, userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Clear previous suggestions immediately
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setStatus("submitted");

      try {
        // Create thread if needed
        let currentThreadId = threadId;
        
        if (!currentThreadId) {
          currentThreadId = await createThread();
        }

        setStatus("streaming");
        setIsStreaming(true);

        // Initiate the stream - messages will appear via the query subscription
        // Title generation is handled server-side after streaming completes
        await initiateStreamAction({
          threadId: currentThreadId,
          prompt: message,
          userId,
        });

        // Generate follow-up suggestions (fire and forget)
        // Small delay to let the reactive query update with the final message
        setIsSuggestionsLoading(true);
        setTimeout(() => {
          const currentMessages = messagesRef.current;
          const lastAssistant = [...currentMessages]
            .reverse()
            .find((m) => m.message?.role === "assistant");
          const lastText = lastAssistant?.text ?? "";

          if (lastText.trim().length >= 10) {
            generateFollowUpsAction({ lastAssistantMessage: lastText })
              .then((result) => setSuggestions(result))
              .catch(() => setSuggestions([]))
              .finally(() => setIsSuggestionsLoading(false));
          } else {
            setIsSuggestionsLoading(false);
          }
        }, 100);

        setStatus("ready");
      } catch (error) {
        console.error("Failed to send message:", error);
        setStatus("error");
      } finally {
        setIsStreaming(false);
      }
    },
    [threadId, createThread, initiateStreamAction, generateFollowUpsAction, userId],
  );

  const stop = useCallback(() => {
    // Currently no stop mechanism in the backend
    // TODO: Implement abort controller support
    setIsStreaming(false);
    setStatus("ready");
  }, []);

  return {
    threadId,
    messages,
    isLoading,
    isStreaming,
    status,
    suggestions,
    isSuggestionsLoading,
    sendMessage,
    createThread,
    stop,
  };
}
