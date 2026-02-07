"use client";

import { ChatSidebarNav } from "./chat-sidebar-nav";
import { ChatSidebarThreads } from "./chat-sidebar-threads";
import { ChatSidebarFooter } from "./chat-sidebar-footer";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-role";

export function ChatSidebar() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const handleNewThread = () => {
    // Navigate to chat index which will create a new thread
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with logo and new chat button */}
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-slate-900 rounded-lg p-2">
            <img src="/Group_239193.png" alt="Anchor" className="h-10 w-auto" />
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewThread}
          aria-label="Nouvelle conversation"
        >
          <PlusIcon className="size-5" />
        </Button>
      </div>

      {/* Role-specific navigation */}
      <ChatSidebarNav role={user?.role} />

      <Separator />

      {/* Thread list */}
      <ScrollArea className="flex-1">
        <ChatSidebarThreads />
      </ScrollArea>

      <Separator />

      {/* User footer */}
      <ChatSidebarFooter user={user} />
    </div>
  );
}
