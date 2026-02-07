import { createFileRoute, Link } from "@tanstack/react-router";
import { BookingCalendar } from "@/features/carrier";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export const Route = createFileRoute("/_app/carrier/bookings")({
  component: CarrierBookings,
});

function CarrierBookings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes reservations</h1>
          <p className="text-muted-foreground">
            Calendrier de vos reservations de creneaux portuaires
          </p>
        </div>
        <Button asChild>
          <Link to="/carrier/bookings/new">
            <PlusIcon className="mr-2 size-4" />
            Nouvelle reservation
          </Link>
        </Button>
      </div>

      {/* Calendar View */}
      <BookingCalendar />
    </div>
  );
}
