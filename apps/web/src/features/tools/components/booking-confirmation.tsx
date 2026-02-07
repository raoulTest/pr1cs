"use client";

import type { ToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingQRCode } from "@/components/ui/booking-qr-code";

interface BookingConfirmationResult {
  success: boolean;
  error?: string;
  bookingReference?: string;
  status?: string;
  wasAutoValidated?: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  terminalName?: string;
  containerCount?: number;
  previousStatus?: string;
  newStatus?: string;
}

export function BookingConfirmationRenderer({
  toolName,
  result,
  state,
}: ToolRendererProps<BookingConfirmationResult>) {
  const isCancel = toolName === "cancelBookingViaAI";

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            {isCancel ? "Annulation en cours..." : "Creation en cours..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (state === "error" || !result) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive flex items-center gap-2">
          <XCircleIcon className="size-4" />
          Erreur lors de l'operation
        </CardContent>
      </Card>
    );
  }

  // Error result
  if (!result.success) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <XCircleIcon className="size-4" />
            {isCancel ? "Annulation echouee" : "Reservation echouee"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {result.error || "Une erreur est survenue"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success result
  return (
    <Card
      className={cn(
        isCancel
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-green-500/50 bg-green-500/5"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "text-sm font-medium flex items-center gap-2",
            isCancel ? "text-amber-700" : "text-green-700"
          )}
        >
          {isCancel ? (
            <>
              <AlertCircleIcon className="size-4" />
              Reservation annulee
            </>
          ) : (
            <>
              <CheckCircleIcon className="size-4" />
              Reservation {result.wasAutoValidated ? "confirmee" : "creee"}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Booking reference */}
        {result.bookingReference && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Reference</span>
            <Badge variant="outline" className="font-mono text-xs">
              {result.bookingReference}
            </Badge>
          </div>
        )}

        {/* Status */}
        {result.status && !isCancel && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Statut</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                result.status === "confirmed"
                  ? "bg-green-500/20 text-green-700 border-green-500/30"
                  : "bg-amber-500/20 text-amber-700 border-amber-500/30"
              )}
            >
              {result.status === "confirmed" ? "Confirme" : "En attente"}
            </Badge>
          </div>
        )}

        {/* Cancelled status change */}
        {isCancel && result.previousStatus && result.newStatus && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Changement</span>
            <span className="text-xs">
              {result.previousStatus} → {result.newStatus}
            </span>
          </div>
        )}

        {/* Date/Time (for creation) */}
        {result.date && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {result.date}
            </span>
            {result.startTime && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {result.startTime} - {result.endTime}
              </span>
            )}
            {result.terminalName && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3" />
                {result.terminalName}
              </span>
            )}
            {result.containerCount && (
              <span className="flex items-center gap-1">
                <PackageIcon className="size-3" />
                {result.containerCount} conteneur(s)
              </span>
            )}
          </div>
        )}

        {/* Auto-validation note */}
        {result.wasAutoValidated !== undefined && !result.wasAutoValidated && (
          <p className="text-xs text-amber-600 pt-2 border-t border-border/50">
            Cette reservation necessite une validation manuelle par l'operateur.
          </p>
        )}

        {/* QR Code for confirmed bookings */}
        {!isCancel && result.status === "confirmed" && result.bookingReference && (
          <div className="flex justify-center pt-3 border-t border-border/50">
            <BookingQRCode bookingReference={result.bookingReference} size={120} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
