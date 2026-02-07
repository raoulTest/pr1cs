import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BookingForm } from "@/features/carrier/components/booking-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CalendarPlusIcon } from "lucide-react";

export const Route = createFileRoute("/_app/carrier/bookings/new")({
  component: NewBookingPage,
});

function NewBookingPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: "/carrier/bookings" });
  };

  const handleCancel = () => {
    navigate({ to: "/carrier/bookings" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/carrier/bookings">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarPlusIcon className="size-6" />
            Nouvelle reservation
          </h1>
          <p className="text-muted-foreground">
            Reservez un creneau pour le passage de votre camion au terminal
          </p>
        </div>
      </div>

      {/* Form */}
      <BookingForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
