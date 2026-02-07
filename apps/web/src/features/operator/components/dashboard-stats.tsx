"use client";

import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageCheckIcon,
  CalendarIcon,
} from "lucide-react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface DashboardStatsProps {
  terminalId: Id<"terminals"> | null;
}

export function DashboardStats({ terminalId }: DashboardStatsProps) {
  const stats = useQuery(
    api.bookings.countByStatus,
    terminalId ? { terminalId } : "skip"
  );

  if (!terminalId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Sélectionnez un terminal pour voir les statistiques
      </div>
    );
  }

  if (stats === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "En attente",
      value: stats.pending,
      icon: ClockIcon,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Confirmées",
      value: stats.confirmed,
      icon: CheckCircleIcon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Refusées",
      value: stats.rejected,
      icon: XCircleIcon,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      title: "Consommées",
      value: stats.consumed,
      icon: PackageCheckIcon,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total",
      value: stats.total,
      icon: CalendarIcon,
      color: "text-slate-500",
      bgColor: "bg-slate-50 dark:bg-slate-950",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`size-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
