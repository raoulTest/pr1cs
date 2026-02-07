"use client";

import type { ToolRendererProps, InteractiveToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingIcon, DoorOpenIcon, MapPinIcon, ClockIcon, ExpandIcon, EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface Terminal {
  _id?: string;
  code: string;
  name: string;
  address?: string | null;
  isActive: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  maxCapacityPerHour?: number;
  defaultSlotCapacity?: number;
  gateCount?: number;
  timezone?: string;
  autoValidationThreshold?: number;
  gates?: Array<{
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
    allowedTruckTypes?: string[];
    allowedTruckClasses?: string[];
  }>;
}

interface TerminalListResult {
  terminals?: Terminal[];
  terminal?: Terminal;
}

// Helper to normalize terminal result - handles both array and object formats
function normalizeTerminalResult(result: unknown): { terminals: Terminal[] } {
  // If result is an array directly (listTerminals returns Array<Terminal>)
  if (Array.isArray(result)) {
    return { terminals: result as Terminal[] };
  }
  // If result is an object with terminals property
  if (result && typeof result === "object") {
    const r = result as TerminalListResult;
    if (r.terminals) {
      return { terminals: r.terminals };
    }
    // Single terminal object (getTerminalDetails returns Terminal | null)
    if (r.terminal) {
      return { terminals: [r.terminal] };
    }
    // Could be a single terminal object directly
    if ("code" in result && "name" in result) {
      return { terminals: [result as Terminal] };
    }
  }
  return { terminals: [] };
}

type TerminalListRendererProps =
  | ToolRendererProps<TerminalListResult>
  | (InteractiveToolRendererProps<TerminalListResult> & {
      previewOnly?: boolean;
      previewCount?: number;
      expanded?: boolean;
    });

function isInteractive(
  props: TerminalListRendererProps
): props is InteractiveToolRendererProps<TerminalListResult> {
  return "onSelect" in props && typeof props.onSelect === "function";
}

export function TerminalListRenderer(props: TerminalListRendererProps) {
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
            <BuildingIcon className="size-4 animate-pulse" />
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

  if (state === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des terminaux
        </CardContent>
      </Card>
    );
  }

  // Normalize the result to handle both array and object formats
  const normalized = normalizeTerminalResult(result);
  const terminals = normalized.terminals;
  const displayTerminals = previewOnly ? terminals.slice(0, previewCount) : terminals;
  const hasMore = terminals.length > previewCount;

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

  const handleExpand = () => {
    if (!openExpandSheet) return;

    openExpandSheet({
      title: `Terminaux (${terminals.length})`,
      toolName: props.toolName,
      toolCallId: isInteractive(props) ? props.toolCallId : `terminals-${Date.now()}`,
      result,
      renderFullContent: () => (
        <TerminalListRenderer {...props} previewOnly={false} expanded />
      ),
    });
  };

  const handleTerminalClick = (terminal: Terminal) => {
    if (!terminal.isActive) return;

    onSelect({
      type: "terminal",
      item: terminal,
      messageToSend: `Je choisis le terminal ${terminal.code} (${terminal.name})`,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BuildingIcon className="size-4" />
          {terminals.length === 1 ? "Terminal" : `Terminaux`}
          {terminals.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {terminals.length}
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
        {displayTerminals.map((terminal) => (
          <button
            key={terminal.code}
            type="button"
            onClick={() => handleTerminalClick(terminal)}
            disabled={!terminal.isActive}
            className={cn(
              "w-full text-left rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2 transition-all",
              terminal.isActive &&
                "hover:ring-2 hover:ring-primary/50 hover:border-primary cursor-pointer",
              !terminal.isActive && "opacity-60 cursor-not-allowed"
            )}
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
                      payload: { terminalCode: terminal.code },
                    });
                  }}
                >
                  <EyeIcon className="size-3 mr-1" />
                  Details
                </Button>
              </div>
            )}
          </button>
        ))}

        {/* Hint text */}
        {terminals.length > 1 && !previewOnly && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Cliquez sur un terminal pour le selectionner
          </p>
        )}

        {/* Show more hint */}
        {previewOnly && hasMore && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{terminals.length - previewCount} autres terminaux
          </p>
        )}
      </CardContent>
    </Card>
  );
}
