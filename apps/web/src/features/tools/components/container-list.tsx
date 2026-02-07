"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageIcon, ScaleIcon, AnchorIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Container {
  _id?: string;
  containerNumber: string;
  containerType: string;
  size: string;
  weight?: number;
  status?: string;
  bookingId?: string;
}

interface ContainerListResult {
  containers?: Container[];
  container?: Container;
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
};

export function ContainerListRenderer({ result, state }: ToolRendererProps<ContainerListResult>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PackageIcon className="size-4" />
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

  if (state === "error" || (!result?.containers && !result?.container)) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des conteneurs
        </CardContent>
      </Card>
    );
  }

  const containers = result.containers ?? (result.container ? [result.container] : []);

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

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PackageIcon className="size-4" />
          {containers.length === 1 ? "Conteneur" : `Conteneurs (${containers.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {containers.map((container) => (
          <div
            key={container.containerNumber}
            className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2"
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
              <span>{SIZE_LABELS[container.size] || container.size}</span>
              {container.weight && (
                <span className="flex items-center gap-1">
                  <ScaleIcon className="size-3" />
                  {container.weight} kg
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
