import { createFileRoute } from "@tanstack/react-router";
import { BookingCalendar } from "@/features/carrier";
import { BookingForm } from "@/features/carrier/components/booking-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/carrier/bookings")({
  component: CarrierBookings,
});

function CarrierBookings() {
  const [open, setOpen] = useState(false);

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              Nouvelle reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle reservation</DialogTitle>
            </DialogHeader>
            <BookingForm
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar View */}
      <BookingCalendar />
    </div>
  );
}
