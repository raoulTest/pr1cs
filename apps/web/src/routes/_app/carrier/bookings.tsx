import { createFileRoute } from "@tanstack/react-router";
import { BookingCalendar } from "@/features/carrier";

export const Route = createFileRoute("/_app/carrier/bookings")({
  component: CarrierBookings,
});

function CarrierBookings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mes reservations</h1>
        <p className="text-muted-foreground">
          Calendrier de vos reservations de creneaux portuaires
        </p>
      </div>

      {/* Calendar View */}
      <BookingCalendar />
    </div>
  );
}
