import { createFileRoute } from "@tanstack/react-router";
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

  const {
    messages,
    isLoading,
    status,
    sendMessage,
    stop,
  } = useThread({ userId });

  // Don't render until we have a user
  if (!user) {
    return null;
  }

  return (
    <ChatView
      messages={messages}
      isLoading={isLoading}
      status={status}
      onSendMessage={sendMessage}
      onStop={stop}
    />
  );
}
