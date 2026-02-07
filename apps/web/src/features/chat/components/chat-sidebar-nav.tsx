"use client";

import { Link } from "@tanstack/react-router";
import type { ApcsRole } from "@/hooks/use-role";
import {
  BuildingIcon,
  UsersIcon,
  TruckIcon,
  DoorOpenIcon,
  ContainerIcon,
  CalendarIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  ClockIcon,
  GridIcon,
  UserCogIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<ApcsRole, NavItem[]> = {
  port_admin: [
    { label: "Terminaux", href: "/admin/terminals", icon: BuildingIcon },
    { label: "Transporteurs", href: "/admin/carriers", icon: UsersIcon },
    { label: "Camions", href: "/admin/trucks", icon: TruckIcon },
    { label: "Portails", href: "/admin/gates", icon: DoorOpenIcon },
    { label: "Réservations", href: "/admin/bookings", icon: CalendarIcon },
    { label: "Utilisateurs", href: "/admin/users", icon: UserCogIcon },
    { label: "Configuration", href: "/admin/config", icon: SettingsIcon },
  ],
  terminal_operator: [
    { label: "Vue d'ensemble", href: "/operator", icon: LayoutDashboardIcon },
    { label: "Réservations", href: "/operator/bookings", icon: CalendarIcon },
    { label: "En attente", href: "/operator/pending", icon: ClockIcon },
    { label: "Capacité", href: "/operator/capacity", icon: GridIcon },
  ],
  carrier: [
    { label: "Mes réservations", href: "/carrier/bookings", icon: CalendarIcon },
    { label: "Mes camions", href: "/carrier/trucks", icon: TruckIcon },
    { label: "Mes conteneurs", href: "/carrier/containers", icon: ContainerIcon },
  ],
};

interface ChatSidebarNavProps {
  role?: ApcsRole | null;
}

export function ChatSidebarNav({ role }: ChatSidebarNavProps) {
  if (!role) return null;

  const items = NAV_ITEMS[role] || [];

  if (items.length === 0) return null;

  return (
    <nav className="px-2 py-3 space-y-1">
      <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Menu
      </p>
      {items.map((item) => (
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
  );
}
