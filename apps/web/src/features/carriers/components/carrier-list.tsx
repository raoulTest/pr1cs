import { api } from "@microhack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { RiAddLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CarrierListProps {
  onCreateClick?: () => void;
}

export function CarrierList({ onCreateClick }: CarrierListProps) {
  const carriers = useQuery(api.carriers.queries.listCarriers, {});

  if (carriers === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
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
          <h2 className="text-2xl font-bold tracking-tight">Transporteurs</h2>
          <p className="text-muted-foreground">
            Liste des transporteurs et leurs statistiques
          </p>
        </div>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <RiAddLine className="mr-2 size-4" />
            Ajouter un transporteur
          </Button>
        )}
      </div>

      {carriers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun transporteur enregistre</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carriers.map((carrier: { userId: string; truckCount: number; containerCount: number; bookingCount: number }) => (
            <Card key={carrier.userId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">{carrier.userId}</CardTitle>
                    <CardDescription className="text-xs">
                      ID Transporteur
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Camions:</span>{" "}
                    <span className="font-medium">{carrier.truckCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conteneurs:</span>{" "}
                    <span className="font-medium">{carrier.containerCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reservations:</span>{" "}
                    <span className="font-medium">{carrier.bookingCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
