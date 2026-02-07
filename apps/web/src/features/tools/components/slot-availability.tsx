"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, CalendarIcon, TruckIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: number;
  maxCapacity: number;
  isRecommended?: boolean;
}

interface SlotAvailabilityResult {
  slots?: TimeSlot[];
  terminalName?: string;
  terminalCode?: string;
}

export function SlotAvailabilityRenderer({ result, state }: ToolRendererProps<SlotAvailabilityResult>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClockIcon className="size-4" />
            Recherche des creneaux...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (state === "error" || !result?.slots) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors de la recherche des creneaux
        </CardContent>
      </Card>
    );
  }

  const { slots, terminalName, terminalCode } = result;

  if (slots.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <ClockIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun creneau disponible</p>
          <p className="text-xs mt-1">Essayez une autre date ou un autre terminal</p>
        </CardContent>
      </Card>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClockIcon className="size-4" />
            Creneaux disponibles
          </span>
          {terminalName && (
            <Badge variant="secondary" className="text-xs">
              {terminalCode || terminalName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(slotsByDate).map(([date, dateSlots]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dateSlots.map((slot) => {
                const availabilityPercent = (slot.available / slot.maxCapacity) * 100;
                const isLow = availabilityPercent <= 20;
                const isFull = slot.available === 0;

                return (
                  <div
                    key={`${slot.date}-${slot.startTime}`}
                    className={cn(
                      "rounded-md border p-2 text-center",
                      isFull
                        ? "border-muted bg-muted/30 opacity-50"
                        : slot.isRecommended
                          ? "border-green-500/50 bg-green-500/10"
                          : isLow
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-border/50 bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {slot.isRecommended && (
                        <StarIcon className="size-3 text-green-600 fill-green-600" />
                      )}
                      <span className="text-sm font-medium">
                        {slot.startTime}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isFull ? (
                        <span className="text-red-600">Complet</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <TruckIcon className="size-3" />
                          {slot.available}/{slot.maxCapacity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
