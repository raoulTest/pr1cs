"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TruckIcon, ScaleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Truck {
  _id?: string;
  licensePlate: string;
  truckType: string;
  truckClass: string;
  isActive: boolean;
  maxContainers?: number;
}

interface TruckListResult {
  trucks?: Truck[];
  truck?: Truck;
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

export function TruckListRenderer({ result, state }: ToolRendererProps<TruckListResult>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TruckIcon className="size-4" />
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

  if (state === "error" || (!result?.trucks && !result?.truck)) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des camions
        </CardContent>
      </Card>
    );
  }

  const trucks = result.trucks ?? (result.truck ? [result.truck] : []);

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

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TruckIcon className="size-4" />
          {trucks.length === 1 ? "Camion" : `Camions (${trucks.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trucks.map((truck) => (
          <div
            key={truck.licensePlate}
            className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2"
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
