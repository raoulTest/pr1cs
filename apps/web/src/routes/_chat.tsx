import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { ChatLayout } from "@/features/chat/components/chat-layout";

export const Route = createFileRoute("/_chat")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <ChatLayout>
      <Outlet />
    </ChatLayout>
  ),
});
