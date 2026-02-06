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
import { Skeleton } from "@/components/ui/skeleton";

interface CarrierListProps {
  onCreateClick?: () => void;
}

export function CarrierList({ onCreateClick }: CarrierListProps) {
  const carriers = useQuery(api.carriers.queries.list, {});

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
          <h2 className="text-2xl font-bold tracking-tight">Carrier Companies</h2>
          <p className="text-muted-foreground">
            Manage carrier companies and their trucks
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Add Carrier
        </Button>
      </div>

      {carriers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No carrier companies yet</p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Create your first carrier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carriers.map((carrier) => (
            <Card key={carrier._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{carrier.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {carrier.code}
                    </CardDescription>
                  </div>
                  <Badge variant={carrier.isActive ? "default" : "secondary"}>
                    {carrier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trucks:</span>{" "}
                    <span className="font-medium">{carrier.truckCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Users:</span>{" "}
                    <span className="font-medium">{carrier.userCount}</span>
                  </div>
                  {carrier.email && (
                    <div className="col-span-2 truncate">
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{carrier.email}</span>
                    </div>
                  )}
                  {carrier.phone && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{carrier.phone}</span>
                    </div>
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
