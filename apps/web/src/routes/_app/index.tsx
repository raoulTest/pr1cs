import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChatView } from "@/features/chat/components/chat-view";
import { useThread } from "@/features/chat/hooks/use-thread";
import { useCurrentUser } from "@/hooks/use-role";

/**
 * Main app index - Chat interface
 * This is the default view when accessing the app
 */
export const Route = createFileRoute("/_app/")({
  component: AppIndexPage,
});

function AppIndexPage() {
  const user = useCurrentUser();
  const userId = user?._id ?? "";
  const navigate = useNavigate();

  const {
    threadId,
    messages,
    isLoading,
    status,
    suggestions,
    isSuggestionsLoading,
    sendMessage,
    stop,
  } = useThread({ userId });

  // Redirect to the thread route once a thread is created
  useEffect(() => {
    if (threadId) {
      navigate({ to: "/$threadId", params: { threadId }, replace: true });
    }
  }, [threadId, navigate]);

  // Don't render until we have a user
  if (!user) {
    return null;
  }

  return (
    <ChatView
      messages={messages}
      isLoading={isLoading}
      status={status}
      suggestions={suggestions}
      isSuggestionsLoading={isSuggestionsLoading}
      onSendMessage={sendMessage}
      onStop={stop}
    />
  );
}
