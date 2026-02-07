"use client";

import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useCurrentUser, type ApcsRole } from "@/hooks/use-role";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronRightIcon,
  ScrollTextIcon,
  BarChart3Icon,
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
  icon: ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  items: NavItem[];
}

const getNavSections = (role: ApcsRole | null | undefined): NavSection[] => {
  if (!role) return [];

  switch (role) {
    case "port_admin":
      return [
        {
          title: "Tableau de bord",
          icon: LayoutDashboardIcon,
          defaultOpen: true,
          items: [
            { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboardIcon },
            { label: "Analytiques", href: "/admin/analytics", icon: BarChart3Icon },
          ],
        },
        {
          title: "Infrastructure",
          icon: BuildingIcon,
          defaultOpen: true,
          items: [
            { label: "Terminaux", href: "/admin/terminals", icon: BuildingIcon },
            { label: "Portes", href: "/admin/gates", icon: DoorOpenIcon },
          ],
        },
        {
          title: "Flotte",
          icon: TruckIcon,
          defaultOpen: false,
          items: [
            { label: "Transporteurs", href: "/admin/carriers", icon: TruckIcon },
            { label: "Camions", href: "/admin/trucks", icon: TruckIcon },
          ],
        },
        {
          title: "Utilisateurs",
          icon: UsersIcon,
          defaultOpen: false,
          items: [
            { label: "Utilisateurs", href: "/admin/users", icon: UsersIcon },
            { label: "Opérateurs", href: "/admin/operators", icon: UserCogIcon },
          ],
        },
        {
          title: "Système",
          icon: SettingsIcon,
          defaultOpen: false,
          items: [
            { label: "Journal d'audit", href: "/admin/audit-logs", icon: ScrollTextIcon },
            { label: "Configuration", href: "/admin/config", icon: SettingsIcon },
          ],
        },
      ];

    case "terminal_operator":
      return [
        {
          title: "Opérations",
          icon: LayoutDashboardIcon,
          defaultOpen: true,
          items: [
            { label: "Tableau de bord", href: "/operator", icon: LayoutDashboardIcon },
            { label: "Réservations", href: "/operator/bookings", icon: CalendarIcon },
            { label: "En attente", href: "/operator/pending", icon: ClockIcon },
          ],
        },
        {
          title: "Gestion",
          icon: GridIcon,
          defaultOpen: true,
          items: [
            { label: "Capacité", href: "/operator/capacity", icon: GridIcon },
            { label: "Analytiques", href: "/operator/analytics", icon: BarChart3Icon },
          ],
        },
      ];

    case "carrier":
      return [
        {
          title: "Mes ressources",
          icon: CalendarIcon,
          defaultOpen: true,
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
// COLLAPSIBLE NAV SECTION
// ============================================================================

function NavSectionGroup({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  const SectionIcon = section.icon;
  const hasActiveItem = section.items.some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" &&
        item.href !== "/operator" &&
        pathname.startsWith(item.href))
  );

  return (
    <Collapsible defaultOpen={section.defaultOpen || hasActiveItem}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group/collapsible">
        <ChevronRightIcon className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        <SectionIcon className="size-3.5" />
        <span className="flex-1 text-left">{section.title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 mt-1">
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/operator" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 ml-3 rounded-md text-sm transition-colors",
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
      </CollapsibleContent>
    </Collapsible>
  );
}

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

      {/* Role-specific navigation with collapsible sections */}
      {navSections.length > 0 && (
        <>
          <nav className="px-2 py-2 space-y-1">
            {navSections.map((section) => (
              <NavSectionGroup
                key={section.title}
                section={section}
                pathname={location.pathname}
              />
            ))}
          </nav>
          <Separator />
        </>
      )}

      {/* Collapsible chat threads section */}
      <Collapsible defaultOpen className="flex flex-col min-h-0 flex-1">
        <div className="px-2 py-2">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group/collapsible">
            <ChevronRightIcon className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            <MessageSquareIcon className="size-3.5" />
            <span className="flex-1 text-left">Conversations</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <ChatSidebarThreads />
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

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
