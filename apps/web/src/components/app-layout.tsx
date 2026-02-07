"use client";

import { useState, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelLeftIcon, PanelLeftCloseIcon, MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";
import { NotificationBell } from "@/features/notifications";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Unified app layout for all authenticated users
 * Shows sidebar with role-based navigation + chat threads
 * Content area displays either chat or page content
 */
export function AppLayout({ children }: AppLayoutProps) {
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
              <AppSidebar />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">APCS</span>
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
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
        <AppSidebar />
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
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
