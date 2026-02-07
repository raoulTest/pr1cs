"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckIcon,
  XIcon,
  TruckIcon,
  CalendarIcon,
  ClockIcon,
  ContainerIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface PendingQueueProps {
  terminalId: Id<"terminals"> | null;
}

export function PendingQueue({ terminalId }: PendingQueueProps) {
  const pendingBookings = useQuery(
    api.bookings.listPendingForOperator,
    terminalId ? { terminalId, limit: 20 } : "skip"
  );
  const confirmBooking = useMutation(api.bookings.confirm);
  const rejectBooking = useMutation(api.bookings.reject);

  const [selectedBookingId, setSelectedBookingId] = useState<Id<"bookings"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogMode, setDialogMode] = useState<"confirm" | "reject" | null>(null);

  if (!terminalId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sélectionnez un terminal pour voir les réservations en attente
      </div>
    );
  }

  if (pendingBookings === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (pendingBookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ClockIcon className="mx-auto mb-4 size-12 opacity-50" />
          <p className="text-lg font-medium">Aucune réservation en attente</p>
          <p className="text-sm">Toutes les réservations ont été traitées</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = async () => {
    if (!selectedBookingId) return;
    setIsProcessing(true);
    try {
      await confirmBooking({ bookingId: selectedBookingId });
      toast.success("Réservation confirmée");
      setDialogMode(null);
      setSelectedBookingId(null);
    } catch (error) {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBookingId) return;
    setIsProcessing(true);
    try {
      await rejectBooking({
        bookingId: selectedBookingId,
        reason: rejectReason || "Réservation refusée par l'opérateur",
      });
      toast.success("Réservation refusée");
      setDialogMode(null);
      setSelectedBookingId(null);
      setRejectReason("");
    } catch (error) {
      toast.error("Erreur lors du refus");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedBooking = pendingBookings.find((b) => b._id === selectedBookingId);

  return (
    <>
      <div className="space-y-3">
        {pendingBookings.map((booking) => (
          <Card key={booking._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Booking Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {booking.bookingReference}
                    </Badge>
                    {booking.wasAutoValidated && (
                      <Badge variant="secondary">Auto-validée</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-4" />
                      {booking.preferredDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-4" />
                      {booking.preferredTimeStart} - {booking.preferredTimeEnd}
                    </span>
                    <span className="flex items-center gap-1">
                      <TruckIcon className="size-4" />
                      {booking.licensePlate}
                    </span>
                    <span className="flex items-center gap-1">
                      <ContainerIcon className="size-4" />
                      {booking.containerCount} conteneur(s)
                    </span>
                  </div>

                  {booking.driverName && (
                    <p className="text-sm">
                      Chauffeur: <span className="font-medium">{booking.driverName}</span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                    onClick={() => {
                      setSelectedBookingId(booking._id);
                      setDialogMode("confirm");
                    }}
                  >
                    <CheckIcon className="mr-1 size-4" />
                    Confirmer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => {
                      setSelectedBookingId(booking._id);
                      setDialogMode("reject");
                    }}
                  >
                    <XIcon className="mr-1 size-4" />
                    Refuser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={dialogMode === "confirm"} onOpenChange={() => setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la réservation</DialogTitle>
            <DialogDescription>
              Confirmez la réservation {selectedBooking?.bookingReference} pour le{" "}
              {selectedBooking?.preferredDate} de {selectedBooking?.preferredTimeStart} à{" "}
              {selectedBooking?.preferredTimeEnd}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? "Confirmation..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogMode === "reject"} onOpenChange={() => setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la réservation</DialogTitle>
            <DialogDescription>
              Refusez la réservation {selectedBooking?.bookingReference}. Vous pouvez fournir
              une raison optionnelle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du refus (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Capacité insuffisante, camion non conforme..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Refus..." : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
