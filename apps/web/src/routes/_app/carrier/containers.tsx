import { createFileRoute } from "@tanstack/react-router";
import { ContainerList } from "@/features/carrier";

export const Route = createFileRoute("/_app/carrier/containers")({
  component: CarrierContainers,
});

function CarrierContainers() {
  return (
    <div className="space-y-6">
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
