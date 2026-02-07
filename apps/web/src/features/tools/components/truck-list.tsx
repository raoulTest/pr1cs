"use client";

import type { ToolRendererProps, InteractiveToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TruckIcon, ScaleIcon, CheckCircleIcon, XCircleIcon, ExpandIcon, EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface Truck {
  _id?: string;
  licensePlate: string;
  truckType: string;
  truckClass: string;
  isActive: boolean;
  maxContainers?: number;
  make?: string;
  model?: string;
  year?: number;
  maxWeight?: number;
}

interface TruckListResult {
  trucks?: Truck[];
  truck?: Truck;
}

// Helper to normalize truck result - handles both array and object formats
function normalizeTruckResult(result: unknown): { trucks: Truck[] } {
  // If result is an array directly (listMyTrucks returns Array<Truck>)
  if (Array.isArray(result)) {
    return { trucks: result as Truck[] };
  }
  // If result is an object
  if (result && typeof result === "object") {
    const r = result as TruckListResult;
    if (r.trucks) {
      return { trucks: r.trucks };
    }
    // Single truck object
    if (r.truck) {
      return { trucks: [r.truck] };
    }
    // Could be a single truck object directly
    if ("licensePlate" in result) {
      return { trucks: [result as Truck] };
    }
  }
  return { trucks: [] };
}

const TYPE_LABELS: Record<string, string> = {
  container: "Conteneur",
  flatbed: "Plateau",
  tanker: "Citerne",
  refrigerated: "Frigorifique",
};

const CLASS_LABELS: Record<string, string> = {
  light: "Leger",
  medium: "Moyen",
  heavy: "Lourd",
  super_heavy: "Tres lourd",
};

type TruckListRendererProps =
  | ToolRendererProps<TruckListResult>
  | (InteractiveToolRendererProps<TruckListResult> & {
      previewOnly?: boolean;
      previewCount?: number;
      expanded?: boolean;
    });

function isInteractive(
  props: TruckListRendererProps
): props is InteractiveToolRendererProps<TruckListResult> {
  return "onSelect" in props && typeof props.onSelect === "function";
}

export function TruckListRenderer(props: TruckListRendererProps) {
  const { result, state } = props;
  const toolUI = useToolUIOptional();

  // Get props with defaults
  const previewOnly = "previewOnly" in props ? props.previewOnly : false;
  const previewCount = "previewOnly" in props ? (props.previewCount ?? 3) : 3;

  // Get handlers
  const onSelect = isInteractive(props)
    ? props.onSelect
    : toolUI?.handleSelection ?? (() => {});

  const onAction = isInteractive(props)
    ? props.onAction
    : toolUI?.handleAction ?? (() => {});

  const openExpandSheet = toolUI?.openExpandSheet;

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TruckIcon className="size-4 animate-pulse" />
            Chargement des camions...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des camions
        </CardContent>
      </Card>
    );
  }

  // Normalize the result to handle both array and object formats
  const normalized = normalizeTruckResult(result);
  const trucks = normalized.trucks;
  const displayTrucks = previewOnly ? trucks.slice(0, previewCount) : trucks;
  const hasMore = trucks.length > previewCount;

  if (trucks.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <TruckIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun camion trouve</p>
        </CardContent>
      </Card>
    );
  }

  const handleExpand = () => {
    if (!openExpandSheet) return;

    openExpandSheet({
      title: `Camions (${trucks.length})`,
      toolName: props.toolName,
      toolCallId: isInteractive(props) ? props.toolCallId : `trucks-${Date.now()}`,
      result,
      renderFullContent: () => (
        <TruckListRenderer {...props} previewOnly={false} expanded />
      ),
    });
  };

  const handleTruckClick = (truck: Truck) => {
    if (!truck.isActive) return;

    onSelect({
      type: "truck",
      item: truck,
      messageToSend: `Je choisis le camion ${truck.licensePlate}`,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TruckIcon className="size-4" />
          {trucks.length === 1 ? "Camion" : "Camions"}
          {trucks.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {trucks.length}
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
      <CardContent className="space-y-3">
        {displayTrucks.map((truck) => (
          <button
            key={truck.licensePlate}
            type="button"
            onClick={() => handleTruckClick(truck)}
            disabled={!truck.isActive}
            className={cn(
              "w-full text-left rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2 transition-all",
              truck.isActive &&
                "hover:ring-2 hover:ring-primary/50 hover:border-primary cursor-pointer",
              !truck.isActive && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono text-sm">
                {truck.licensePlate}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  truck.isActive
                    ? "bg-green-500/20 text-green-700 border-green-500/30"
                    : "bg-red-500/20 text-red-700 border-red-500/30"
                )}
              >
                {truck.isActive ? (
                  <>
                    <CheckCircleIcon className="size-3 mr-1" />
                    Actif
                  </>
                ) : (
                  <>
                    <XCircleIcon className="size-3 mr-1" />
                    Inactif
                  </>
                )}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{TYPE_LABELS[truck.truckType] || truck.truckType}</span>
              <span className="flex items-center gap-1">
                <ScaleIcon className="size-3" />
                {CLASS_LABELS[truck.truckClass] || truck.truckClass}
              </span>
              {truck.maxContainers && (
                <span>Max: {truck.maxContainers} conteneur(s)</span>
              )}
            </div>

            {/* Action buttons - only in expanded/full view */}
            {!previewOnly && (
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction({
                      type: "view-details",
                      label: "Voir details",
                      payload: { licensePlate: truck.licensePlate },
                    });
                  }}
                >
                  <EyeIcon className="size-3 mr-1" />
                  Details
                </Button>
                {truck.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 text-green-700 hover:bg-green-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTruckClick(truck);
                    }}
                  >
                    <CheckCircleIcon className="size-3 mr-1" />
                    Selectionner
                  </Button>
                )}
              </div>
            )}
          </button>
        ))}

        {/* Hint text */}
        {trucks.length > 1 && !previewOnly && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Cliquez sur un camion actif pour le selectionner
          </p>
        )}

        {/* Show more hint */}
        {previewOnly && hasMore && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{trucks.length - previewCount} autres camions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
