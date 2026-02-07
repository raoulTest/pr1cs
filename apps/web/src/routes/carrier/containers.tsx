import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ContainerList } from "@/features/carrier";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/carrier/containers")({
  component: CarrierContainers,
});

function CarrierContainers() {
  return (
    <>
      <Authenticated>
        <CarrierContainersContent />
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
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

function CarrierContainersContent() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mes conteneurs</h1>
        <p className="text-muted-foreground">
          Apercu de vos conteneurs enregistres et leur statut
        </p>
      </div>

      {/* Container List */}
      <ContainerList />
    </div>
  );
}
