"use client";

import type { ToolRendererProps, InteractiveToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageIcon, ScaleIcon, AnchorIcon, ExpandIcon, EyeIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface Container {
  _id?: string;
  containerNumber: string;
  containerType: string;
  // Backend uses dimensions, not size
  size?: string;
  dimensions?: string;
  weight?: number;
  weightClass?: string;
  status?: string;
  bookingId?: string;
  isBooked?: boolean;
  operationType?: string;
  isEmpty?: boolean;
  readyDate?: string;
  departureDate?: string;
  notes?: string;
  booking?: {
    bookingReference: string;
    status: string;
    date: string;
    startTime: string;
  };
}

interface ContainerListResult {
  containers?: Container[];
  container?: Container;
}

// Helper to normalize container result - handles both array and object formats
function normalizeContainerResult(result: unknown): { containers: Container[] } {
  // If result is an array directly (listMyContainers returns Array<Container>)
  if (Array.isArray(result)) {
    return { containers: result as Container[] };
  }
  // If result is an object
  if (result && typeof result === "object") {
    const r = result as ContainerListResult;
    if (r.containers) {
      return { containers: r.containers };
    }
    // Single container object (getContainerDetails returns Container | null)
    if (r.container) {
      return { containers: [r.container] };
    }
    // Could be a single container object directly
    if ("containerNumber" in result) {
      return { containers: [result as Container] };
    }
  }
  return { containers: [] };
}

const TYPE_LABELS: Record<string, string> = {
  dry: "Standard",
  reefer: "Refrigere",
  open_top: "Toit ouvert",
  flat_rack: "Flat rack",
  tank: "Citerne",
};

const SIZE_LABELS: Record<string, string> = {
  "20ft": "20 pieds",
  "40ft": "40 pieds",
  "40ft_hc": "40 pieds HC",
  "45ft": "45 pieds",
  "20": "20 pieds",
  "40": "40 pieds",
  "40HC": "40 pieds HC",
  "45": "45 pieds",
};

type ContainerListRendererProps =
  | ToolRendererProps<ContainerListResult>
  | (InteractiveToolRendererProps<ContainerListResult> & {
      previewOnly?: boolean;
      previewCount?: number;
      expanded?: boolean;
    });

function isInteractive(
  props: ContainerListRendererProps
): props is InteractiveToolRendererProps<ContainerListResult> {
  return "onSelect" in props && typeof props.onSelect === "function";
}

export function ContainerListRenderer(props: ContainerListRendererProps) {
  const { result, state } = props;
  const toolUI = useToolUIOptional();

  // Get props with defaults
  const previewOnly = "previewOnly" in props ? props.previewOnly : false;
  const previewCount = "previewCount" in props ? (props.previewCount ?? 3) : 3;

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
            <PackageIcon className="size-4 animate-pulse" />
            Chargement des conteneurs...
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
          Erreur lors du chargement des conteneurs
        </CardContent>
      </Card>
    );
  }

  // Normalize the result to handle both array and object formats
  const normalized = normalizeContainerResult(result);
  const containers = normalized.containers;
  const displayContainers = previewOnly ? containers.slice(0, previewCount) : containers;
  const hasMore = containers.length > previewCount;

  if (containers.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <PackageIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun conteneur trouve</p>
        </CardContent>
      </Card>
    );
  }

  const handleExpand = () => {
    if (!openExpandSheet) return;

    openExpandSheet({
      title: `Conteneurs (${containers.length})`,
      toolName: props.toolName,
      toolCallId: isInteractive(props) ? props.toolCallId : `containers-${Date.now()}`,
      result,
      renderFullContent: () => (
        <ContainerListRenderer {...props} previewOnly={false} expanded />
      ),
    });
  };

  const handleContainerClick = (container: Container) => {
    // Only allow selection if container is available (not booked)
    if (container.bookingId) return;

    onSelect({
      type: "container",
      item: container,
      messageToSend: `Je choisis le conteneur ${container.containerNumber}`,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PackageIcon className="size-4" />
          {containers.length === 1 ? "Conteneur" : "Conteneurs"}
          {containers.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {containers.length}
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
        {displayContainers.map((container) => {
          const isAvailable = !container.bookingId && !container.isBooked;

          return (
            <button
              key={container.containerNumber}
              type="button"
              onClick={() => handleContainerClick(container)}
              disabled={!isAvailable}
              className={cn(
                "w-full text-left rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2 transition-all",
                isAvailable &&
                  "hover:ring-2 hover:ring-primary/50 hover:border-primary cursor-pointer",
                !isAvailable && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-mono text-xs">
                  {container.containerNumber}
                </Badge>
                {container.bookingId ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-500/20 text-blue-700 border-blue-500/30"
                  >
                    Reserve
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-500/20 text-green-700 border-green-500/30"
                  >
                    Disponible
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <AnchorIcon className="size-3" />
                  {TYPE_LABELS[container.containerType] || container.containerType}
                </span>
                <span>{SIZE_LABELS[container.dimensions || container.size || ""] || container.dimensions || container.size}</span>
                {container.weight && (
                  <span className="flex items-center gap-1">
                    <ScaleIcon className="size-3" />
                    {container.weight} kg
                  </span>
                )}
                {container.operationType && (
                  <span>
                    {container.operationType === "pick_up" ? "Enlevement" : "Depot"}
                  </span>
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
                        payload: { containerNumber: container.containerNumber },
                      });
                    }}
                  >
                    <EyeIcon className="size-3 mr-1" />
                    Details
                  </Button>
                  {isAvailable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-green-700 hover:bg-green-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContainerClick(container);
                      }}
                    >
                      <CheckCircleIcon className="size-3 mr-1" />
                      Selectionner
                    </Button>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Hint text */}
        {containers.length > 1 && !previewOnly && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Cliquez sur un conteneur disponible pour le selectionner
          </p>
        )}

        {/* Show more hint */}
        {previewOnly && hasMore && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{containers.length - previewCount} autres conteneurs
          </p>
        )}
      </CardContent>
    </Card>
  );
}
