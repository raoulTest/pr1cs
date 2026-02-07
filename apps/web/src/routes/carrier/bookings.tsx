import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { BookingCalendar } from "@/features/carrier";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/carrier/bookings")({
  component: CarrierBookings,
});

function CarrierBookings() {
  return (
    <>
      <Authenticated>
        <CarrierBookingsContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Veuillez vous connecter pour acceder a cette page</p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </AuthLoading>
    </>
  );
}

function CarrierBookingsContent() {
  return (
    <div className="container mx-auto py-6 space-y-6">
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
