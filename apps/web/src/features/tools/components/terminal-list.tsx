"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingIcon, DoorOpenIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Terminal {
  _id?: string;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  maxCapacityPerHour?: number;
  gateCount?: number;
}

interface TerminalListResult {
  terminals?: Terminal[];
  terminal?: Terminal;
}

export function TerminalListRenderer({ result, state }: ToolRendererProps<TerminalListResult>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BuildingIcon className="size-4" />
            Chargement des terminaux...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (state === "error" || (!result?.terminals && !result?.terminal)) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des terminaux
        </CardContent>
      </Card>
    );
  }

  // Handle single terminal (getTerminalDetails)
  const terminals = result.terminals ?? (result.terminal ? [result.terminal] : []);

  if (terminals.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <BuildingIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun terminal trouve</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BuildingIcon className="size-4" />
          {terminals.length === 1 ? "Terminal" : `Terminaux (${terminals.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {terminals.map((terminal) => (
          <div
            key={terminal.code}
            className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {terminal.code}
                </Badge>
                <span className="font-medium text-sm">{terminal.name}</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  terminal.isActive
                    ? "bg-green-500/20 text-green-700 border-green-500/30"
                    : "bg-red-500/20 text-red-700 border-red-500/30"
                )}
              >
                {terminal.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {terminal.address && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {terminal.address}
                </span>
              )}
              {terminal.operatingHoursStart && terminal.operatingHoursEnd && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {terminal.operatingHoursStart} - {terminal.operatingHoursEnd}
                </span>
              )}
              {terminal.gateCount && (
                <span className="flex items-center gap-1">
                  <DoorOpenIcon className="size-3" />
                  {terminal.gateCount} portail(s)
                </span>
              )}
              {terminal.maxCapacityPerHour && (
                <span>Capacite: {terminal.maxCapacityPerHour}/h</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
