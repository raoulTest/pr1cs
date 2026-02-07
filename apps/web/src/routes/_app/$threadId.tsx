import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/features/chat/components/chat-view";
import { useThread } from "@/features/chat/hooks/use-thread";
import { useCurrentUser } from "@/hooks/use-role";

/**
 * Chat thread view - Shows a specific conversation
 */
export const Route = createFileRoute("/_app/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const user = useCurrentUser();
  const userId = user?._id ?? "";

  const {
    messages,
    isLoading,
    status,
    sendMessage,
    stop,
  } = useThread({ userId, threadId });

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
