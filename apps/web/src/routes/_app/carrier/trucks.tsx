import { createFileRoute } from "@tanstack/react-router";
import { TruckList } from "@/features/carrier";

export const Route = createFileRoute("/_app/carrier/trucks")({
  component: CarrierTrucks,
});

function CarrierTrucks() {
  return (
    <div className="space-y-6">
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
