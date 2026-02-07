"use client";

import type { ToolRendererProps, InteractiveToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, CalendarIcon, TruckIcon, StarIcon, ExpandIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface TimeSlot {
  date?: string;
  startTime: string;
  endTime: string;
  // Backend uses remainingCapacity, not available
  available?: number;
  remainingCapacity?: number;
  maxCapacity: number;
  currentBookings?: number;
  isRecommended?: boolean;
  isAvailable?: boolean;
  autoValidationRemaining?: number;
  // For suggestOptimalSlots
  score?: number;
  reason?: string;
}

interface SlotAvailabilityResult {
  slots?: TimeSlot[];
  // For suggestOptimalSlots
  suggestions?: TimeSlot[];
  terminalName?: string;
  terminalCode?: string;
  date?: string;
  terminal?: { name: string; code: string };
}

// Helper to normalize slot availability result
function normalizeSlotResult(result: unknown): { slots: TimeSlot[]; terminalName?: string; terminalCode?: string; date?: string } {
  if (!result) return { slots: [] };
  
  // Handle object with slots or suggestions
  if (typeof result === "object") {
    const r = result as SlotAvailabilityResult;
    
    // Get the base date from result
    const baseDate = r.date || new Date().toISOString().slice(0, 10);
    
    // Get slots from either slots or suggestions
    let rawSlots = r.slots || r.suggestions || [];
    
    // Normalize each slot - map remainingCapacity to available, ensure date exists
    const slots: TimeSlot[] = rawSlots.map(slot => ({
      ...slot,
      date: slot.date || baseDate,
      available: slot.available ?? slot.remainingCapacity ?? (slot.maxCapacity - (slot.currentBookings ?? 0)),
    }));
    
    return {
      slots,
      terminalName: r.terminalName || r.terminal?.name,
      terminalCode: r.terminalCode || r.terminal?.code,
      date: r.date,
    };
  }
  
  return { slots: [] };
}

type SlotAvailabilityRendererProps =
  | ToolRendererProps<SlotAvailabilityResult>
  | (InteractiveToolRendererProps<SlotAvailabilityResult> & {
      previewOnly?: boolean;
      previewCount?: number;
      expanded?: boolean;
    });

function isInteractive(
  props: SlotAvailabilityRendererProps
): props is InteractiveToolRendererProps<SlotAvailabilityResult> {
  return "onSelect" in props && typeof props.onSelect === "function";
}

export function SlotAvailabilityRenderer(props: SlotAvailabilityRendererProps) {
  const { result, state } = props;
  const toolUI = useToolUIOptional();

  // Get props with defaults
  const previewOnly = "previewOnly" in props ? props.previewOnly : false;
  const previewCount = "previewCount" in props ? (props.previewCount ?? 6) : 6;

  // Get handlers
  const onSelect = isInteractive(props)
    ? props.onSelect
    : toolUI?.handleSelection ?? (() => {});

  const openExpandSheet = toolUI?.openExpandSheet;

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClockIcon className="size-4 animate-pulse" />
            Recherche des creneaux...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors de la recherche des creneaux
        </CardContent>
      </Card>
    );
  }

  // Normalize the result to handle various formats
  const normalized = normalizeSlotResult(result);
  const { slots, terminalName, terminalCode } = normalized;

  if (!slots || slots.length === 0) {
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

  const hasMore = slots.length > previewCount;

  const handleExpand = () => {
    if (!openExpandSheet) return;

    openExpandSheet({
      title: `Creneaux disponibles (${slots.length})`,
      description: terminalName
        ? `Terminal: ${terminalCode || terminalName}`
        : undefined,
      toolName: props.toolName,
      toolCallId: isInteractive(props) ? props.toolCallId : `slots-${Date.now()}`,
      result,
      renderFullContent: () => (
        <SlotAvailabilityRenderer {...props} previewOnly={false} expanded />
      ),
    });
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if ((slot.available ?? 0) === 0) return;

    const slotDate = slot.date || new Date().toISOString().slice(0, 10);
    const formattedDate = new Date(slotDate).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });

    onSelect({
      type: "slot",
      item: slot,
      messageToSend: `Je veux reserver le creneau de ${slot.startTime} le ${formattedDate}${terminalName ? ` au terminal ${terminalCode || terminalName}` : ""}`,
    });
  };

  // For preview mode, limit the display
  const displaySlots = previewOnly ? slots.slice(0, previewCount) : slots;
  const displaySlotsByDate = displaySlots.reduce(
    (acc, slot) => {
      const dateKey = slot.date || "unknown";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ClockIcon className="size-4" />
          <span>Creneaux disponibles</span>
          <Badge variant="secondary" className="text-xs">
            {slots.length}
          </Badge>
          {terminalName && (
            <Badge variant="outline" className="text-xs ml-auto">
              {terminalCode || terminalName}
            </Badge>
          )}
        </CardTitle>
        {previewOnly && hasMore && openExpandSheet && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleExpand}
              title="Voir tout"
            >
              <ExpandIcon className="size-4" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(displaySlotsByDate).map(([date, dateSlots]) => (
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
                const available = slot.available ?? 0;
                const availabilityPercent =
                  (available / slot.maxCapacity) * 100;
                const isLow = availabilityPercent <= 20;
                const isFull = available === 0;

                return (
                  <button
                    key={`${slot.date || "unknown"}-${slot.startTime}`}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    disabled={isFull}
                    className={cn(
                      "rounded-md border p-2 text-center transition-all",
                      "hover:ring-2 hover:ring-primary/50 hover:border-primary",
                      "focus:outline-none focus:ring-2 focus:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-0",
                      isFull
                        ? "border-muted bg-muted/30"
                        : slot.isRecommended
                          ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                          : isLow
                            ? "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20"
                            : "border-border/50 bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {slot.isRecommended && (
                        <StarIcon className="size-3 text-green-600 fill-green-600" />
                      )}
                      <span className="text-sm font-medium">{slot.startTime}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isFull ? (
                        <span className="text-red-600">Complet</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <TruckIcon className="size-3" />
                          {available}/{slot.maxCapacity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Hint text */}
        {!previewOnly && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Cliquez sur un creneau pour le selectionner
          </p>
        )}

        {/* Show more hint */}
        {previewOnly && hasMore && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{slots.length - previewCount} autres creneaux
          </p>
        )}
      </CardContent>
    </Card>
  );
}
