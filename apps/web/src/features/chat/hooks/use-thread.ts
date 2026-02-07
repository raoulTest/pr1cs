import { useState, useCallback, useEffect } from "react";
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

  // Sync threadId state with prop changes (for navigation)
  useEffect(() => {
    setThreadId(initialThreadId);
  }, [initialThreadId]);

  // Actions
  const createThreadAction = useAction(api.ai.chat.createThread);
  const initiateStreamAction = useAction(api.ai.chat.initiateStream);
  const generateTitleAction = useAction(api.ai.chat.generateThreadTitle);

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

  const createThread = useCallback(async (): Promise<string> => {
    const newThreadId = await createThreadAction({ userId });
    setThreadId(newThreadId);
    return newThreadId;
  }, [createThreadAction, userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setStatus("submitted");

      try {
        // Create thread if needed
        let currentThreadId = threadId;
        const isNewThread = !currentThreadId;
        
        if (!currentThreadId) {
          currentThreadId = await createThread();
        }

        setStatus("streaming");
        setIsStreaming(true);

        // Initiate the stream - messages will appear via the query subscription
        await initiateStreamAction({
          threadId: currentThreadId,
          prompt: message,
          userId,
        });

        // Generate title for new threads (fire and forget)
        if (isNewThread) {
          generateTitleAction({
            threadId: currentThreadId,
            firstMessage: message,
          }).catch(console.error);
        }

        setStatus("ready");
      } catch (error) {
        console.error("Failed to send message:", error);
        setStatus("error");
      } finally {
        setIsStreaming(false);
      }
    },
    [threadId, createThread, initiateStreamAction, generateTitleAction, userId],
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
    sendMessage,
    createThread,
    stop,
  };
}
