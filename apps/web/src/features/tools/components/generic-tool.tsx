"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WrenchIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic tool renderer for tools without a specific renderer.
 * Displays the raw result in a collapsible JSON view.
 */
export function GenericToolRenderer({ toolName, args, result, state }: ToolRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WrenchIcon className="size-4" />
            <span className="font-mono">{toolName}</span>
            <Badge variant="secondary" className="text-xs">En cours...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <WrenchIcon className="size-4" />
            <span className="font-mono">{toolName}</span>
            <Badge variant="destructive" className="text-xs">Erreur</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Une erreur est survenue lors de l'execution de cet outil.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WrenchIcon className="size-4 text-muted-foreground" />
            <span className="font-mono">{toolName}</span>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
              Complete
            </Badge>
          </CardTitle>
          {isExpanded ? (
            <ChevronUpIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Arguments */}
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Arguments:</p>
              <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Resultat:</p>
            <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto max-h-48">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
