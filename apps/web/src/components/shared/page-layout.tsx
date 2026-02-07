"use client";

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-media-query";
import { useCurrentUser } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import {
  MenuIcon,
  MessageSquareIcon,
  CalendarIcon,
  ClockIcon,
  GridIcon,
  TruckIcon,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComponentType } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const OPERATOR_NAV: NavItem[] = [
  { label: "Vue d'ensemble", href: "/operator", icon: LayoutDashboardIcon },
  { label: "Reservations", href: "/operator/bookings", icon: CalendarIcon },
  { label: "En attente", href: "/operator/pending", icon: ClockIcon },
  { label: "Capacite", href: "/operator/capacity", icon: GridIcon },
];

const CARRIER_NAV: NavItem[] = [
  { label: "Mes reservations", href: "/carrier/bookings", icon: CalendarIcon },
  { label: "Mes camions", href: "/carrier/trucks", icon: TruckIcon },
  { label: "Mes conteneurs", href: "/carrier/containers", icon: ContainerIcon },
];

interface PageLayoutProps {
  children: ReactNode;
  role: "operator" | "carrier";
}

export function PageLayout({ children, role }: PageLayoutProps) {
  const isMobile = useIsMobile();
  const user = useCurrentUser();
  const navigate = useNavigate();

  const navItems = role === "operator" ? OPERATOR_NAV : CARRIER_NAV;

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-slate-900 rounded-lg p-2">
            <img src="/Group_239193.png" alt="Anchor" className="h-10 w-auto" />
          </div>
        </Link>
      </div>

      {/* Back to Chat */}
      <div className="px-4 pb-2">
        <Button asChild variant="outline" size="sm" className="w-full justify-start">
          <Link to="/">
            <MessageSquareIcon className="mr-2 size-4" />
            Retour au chat
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Footer */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
              <Avatar className="size-8">
                <AvatarImage src={user?.image} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user?.name ?? "Utilisateur"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/">
                <MessageSquareIcon className="mr-2 size-4" />
                Retour au chat
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOutIcon className="mr-2 size-4" />
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

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
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="bg-slate-900 rounded-lg p-1.5">
            <img src="/Group_239193.png" alt="Anchor" className="h-8 w-auto" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
