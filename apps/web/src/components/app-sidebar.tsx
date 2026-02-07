"use client";

import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useCurrentUser, type ApcsRole } from "@/hooks/use-role";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusIcon,
  ContainerIcon,
  BuildingIcon,
  UsersIcon,
  TruckIcon,
  DoorOpenIcon,
  CalendarIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  ClockIcon,
  GridIcon,
  UserCogIcon,
  LogOutIcon,
  MessageSquareIcon,
  ChevronDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import type { ComponentType } from "react";
import { ChatSidebarThreads } from "@/features/chat/components/chat-sidebar-threads";

// ============================================================================
// NAVIGATION CONFIG - Define all nav items per role
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getNavSections = (role: ApcsRole | null | undefined): NavSection[] => {
  if (!role) return [];

  switch (role) {
    case "port_admin":
      return [
        {
          title: "Administration",
          items: [
            { label: "Tableau de bord", href: "/admin", icon: LayoutDashboardIcon },
            { label: "Terminaux", href: "/admin/terminals", icon: BuildingIcon },
            { label: "Portes", href: "/admin/gates", icon: DoorOpenIcon },
            { label: "Transporteurs", href: "/admin/carriers", icon: TruckIcon },
            { label: "Camions", href: "/admin/trucks", icon: TruckIcon },
            { label: "Utilisateurs", href: "/admin/users", icon: UsersIcon },
            { label: "Opérateurs", href: "/admin/operators", icon: UserCogIcon },
            { label: "Configuration", href: "/admin/config", icon: SettingsIcon },
          ],
        },
      ];

    case "terminal_operator":
      return [
        {
          title: "Opérations",
          items: [
            { label: "Tableau de bord", href: "/operator", icon: LayoutDashboardIcon },
            { label: "Réservations", href: "/operator/bookings", icon: CalendarIcon },
            { label: "En attente", href: "/operator/pending", icon: ClockIcon },
            { label: "Capacité", href: "/operator/capacity", icon: GridIcon },
          ],
        },
      ];

    case "carrier":
      return [
        {
          title: "Mes ressources",
          items: [
            { label: "Mes réservations", href: "/carrier/bookings", icon: CalendarIcon },
            { label: "Mes camions", href: "/carrier/trucks", icon: TruckIcon },
            { label: "Mes conteneurs", href: "/carrier/containers", icon: ContainerIcon },
          ],
        },
      ];

    default:
      return [];
  }
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function AppSidebar() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const navSections = getNavSections(user?.role);

  const handleNewThread = () => {
    navigate({ to: "/" });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
  };

  const getRoleLabel = (role?: ApcsRole) => {
    switch (role) {
      case "port_admin":
        return "Administrateur";
      case "terminal_operator":
        return "Opérateur";
      case "carrier":
        return "Transporteur";
      default:
        return "Utilisateur";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with logo and new chat button */}
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <ContainerIcon className="size-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">APCS</span>
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
      {navSections.length > 0 && (
        <>
          <nav className="px-2 py-2 space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== "/admin" && 
                       item.href !== "/operator" && 
                       location.pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <Separator />
        </>
      )}

      {/* Chat threads section */}
      <div className="px-2 py-2">
        <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <MessageSquareIcon className="size-3" />
          Conversations
        </p>
      </div>
      <ScrollArea className="flex-1">
        <ChatSidebarThreads />
      </ScrollArea>

      <Separator />

      {/* User footer */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2 px-2"
            >
              <Avatar className="size-8">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || user?.email || "Utilisateur"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRoleLabel(user?.role)}
                </p>
              </div>
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <SettingsIcon className="size-4 mr-2" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOutIcon className="size-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
