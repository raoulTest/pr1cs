"use client";

import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContainerIcon, BoxIcon, PackageIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ContainerType = "standard" | "reefer" | "open_top" | "flat_rack" | "tank";
type ContainerDimensions = "20ft" | "40ft" | "40ft_hc" | "45ft";
type ContainerOperation = "pick_up" | "drop_off";

const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  standard: "Standard",
  reefer: "Frigorifique",
  open_top: "Toit ouvert",
  flat_rack: "Flat rack",
  tank: "Citerne",
};

const CONTAINER_DIM_LABELS: Record<ContainerDimensions, string> = {
  "20ft": "20 pieds",
  "40ft": "40 pieds",
  "40ft_hc": "40 pieds HC",
  "45ft": "45 pieds",
};

const OPERATION_LABELS: Record<ContainerOperation, string> = {
  pick_up: "Enlevement",
  drop_off: "Depot",
};

export function ContainerList() {
  const [operationFilter, setOperationFilter] = useState<ContainerOperation | "all">("all");
  
  const containers = useQuery(api.containers.listMy, {
    operationType: operationFilter === "all" ? undefined : operationFilter,
    limit: 100,
  });
  const counts = useQuery(api.containers.countByOperation, {});

  if (containers === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      {counts && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PackageIcon className="size-4 text-emerald-500" />
                Enlevements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.pickUp.available}</div>
              <p className="text-sm text-muted-foreground">
                disponibles sur {counts.pickUp.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BoxIcon className="size-4 text-blue-500" />
                Depots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.dropOff.available}</div>
              <p className="text-sm text-muted-foreground">
                disponibles sur {counts.dropOff.total} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select
          value={operationFilter}
          onValueChange={(v) => setOperationFilter(v as ContainerOperation | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les operations</SelectItem>
            <SelectItem value="pick_up">Enlevements</SelectItem>
            <SelectItem value="drop_off">Depots</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground">
          {containers.length} conteneur(s)
        </p>
      </div>

      {containers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ContainerIcon className="mx-auto mb-4 size-12 opacity-50" />
            <p className="text-lg font-medium">Aucun conteneur</p>
            <p className="text-sm">
              Vos conteneurs apparaitront ici une fois enregistres via l'assistant
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {containers.map((container) => (
            <Card
              key={container._id}
              className={cn(container.isBooked && "border-primary")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-mono">
                    {container.containerNumber}
                  </CardTitle>
                  <div className="flex gap-1">
                    {container.isBooked && (
                      <Badge>Reserve</Badge>
                    )}
                    <Badge
                      variant={container.operationType === "pick_up" ? "default" : "secondary"}
                    >
                      {OPERATION_LABELS[container.operationType]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{CONTAINER_TYPE_LABELS[container.containerType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>{CONTAINER_DIM_LABELS[container.dimensions]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Etat:</span>
                    <span>{container.isEmpty ? "Vide" : "Charge"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
