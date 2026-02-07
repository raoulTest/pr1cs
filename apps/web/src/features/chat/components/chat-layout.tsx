"use client";

import { useState, type ReactNode } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelLeftIcon, PanelLeftCloseIcon, MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface ChatLayoutProps {
  children: ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ChatSidebar />
            </SheetContent>
          </Sheet>
          <div className="bg-slate-900 rounded-lg p-1.5">
            <img src="/Group_239193.png" alt="Anchor" className="h-8 w-auto" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  // Desktop: Collapsible sidebar
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex-shrink-0 border-r border-border bg-card transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <ChatSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header with toggle */}
        <header className="flex h-14 items-center gap-4 border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Fermer le panneau" : "Ouvrir le panneau"}
          >
            {sidebarOpen ? (
              <PanelLeftCloseIcon className="size-5" />
            ) : (
              <PanelLeftIcon className="size-5" />
            )}
          </Button>
        </header>

        {/* Chat content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
