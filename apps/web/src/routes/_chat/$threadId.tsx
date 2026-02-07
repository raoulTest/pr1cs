import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/features/chat/components/chat-view";
import { useThread } from "@/features/chat/hooks/use-thread";
import { useCurrentUser } from "@/hooks/use-role";

export const Route = createFileRoute("/_chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
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
