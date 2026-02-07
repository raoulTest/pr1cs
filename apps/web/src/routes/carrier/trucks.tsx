import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { TruckList } from "@/features/carrier";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/carrier/trucks")({
  component: CarrierTrucks,
});

function CarrierTrucks() {
  return (
    <>
      <Authenticated>
        <CarrierTrucksContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Veuillez vous connecter pour acceder a cette page</p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

function CarrierTrucksContent() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mes camions</h1>
        <p className="text-muted-foreground">
          Gerez les camions de votre flotte pour vos reservations
        </p>
      </div>

      {/* Truck List */}
      <TruckList />
    </div>
  );
}
