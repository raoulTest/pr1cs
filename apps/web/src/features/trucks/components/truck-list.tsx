import { api } from "@microhack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { RiAddLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface TruckListProps {
  onCreateClick?: () => void;
}

export function TruckList({ onCreateClick }: TruckListProps) {
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");

  // Use listCarriers for admin view - returns carriers with their stats
  const carriers = useQuery(api.carriers.queries.listCarriers, { limit: 100 });
  
  // Use listByOwner to get trucks for selected carrier
  const trucks = useQuery(
    api.trucks.queries.listByOwner,
    selectedCarrierId
      ? { ownerId: selectedCarrierId }
      : "skip"
  );

  if (carriers === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Camions</h2>
          <p className="text-muted-foreground">
            Gérer les camions de la flotte des transporteurs
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Ajouter un camion
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedCarrierId} onValueChange={setSelectedCarrierId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un transporteur" />
            </SelectTrigger>
            <SelectContent>
              {carriers.map((carrier) => (
                <SelectItem key={carrier.userId} value={carrier.userId}>
                  {carrier.userId} ({carrier.truckCount} camions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedCarrierId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Sélectionnez un transporteur ci-dessus pour voir ses camions
            </p>
          </CardContent>
        </Card>
      ) : trucks === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : trucks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucun camion trouvé pour ce transporteur
            </p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Enregistrer le premier camion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <Card key={truck._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">
                      {truck.licensePlate}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {truck.make && truck.model
                        ? `${truck.make} ${truck.model}`
                        : truck.make || truck.model || "Marque/modèle inconnu"}
                      {truck.year ? ` (${truck.year})` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant={truck.isActive ? "default" : "secondary"}>
                    {truck.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{truck.truckType}</Badge>
                  <Badge variant="outline">{truck.truckClass}</Badge>
                  {truck.maxWeight && (
                    <Badge variant="outline">
                      {(truck.maxWeight / 1000).toFixed(1)}t max
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
