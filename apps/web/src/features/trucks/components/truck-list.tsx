import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
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

  const carriers = useQuery(api.carriers.queries.list, {});
  const trucks = useQuery(
    api.trucks.queries.listByCompany,
    selectedCarrierId
      ? { carrierCompanyId: selectedCarrierId as Id<"carrierCompanies"> }
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

  const activeCarriers = carriers.filter((c) => c.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trucks</h2>
          <p className="text-muted-foreground">
            Manage trucks in carrier fleets
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Add Truck
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedCarrierId} onValueChange={setSelectedCarrierId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a carrier to view trucks" />
            </SelectTrigger>
            <SelectContent>
              {activeCarriers.map((carrier) => (
                <SelectItem key={carrier._id} value={carrier._id}>
                  {carrier.name} ({carrier.code})
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
              Select a carrier company above to view its trucks
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
              No trucks found for this carrier
            </p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Register first truck
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
                        : truck.make || truck.model || "Unknown make/model"}
                      {truck.year ? ` (${truck.year})` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant={truck.isActive ? "default" : "secondary"}>
                    {truck.isActive ? "Active" : "Inactive"}
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
