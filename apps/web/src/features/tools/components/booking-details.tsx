"use client";

import type { ToolRendererProps, InteractiveToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  PackageIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface BookingDetails {
  bookingReference: string;
  status: string;
  // Backend uses date/startTime/endTime, not preferredDate/preferredTimeStart/preferredTimeEnd
  preferredDate?: string;
  date?: string;
  preferredTimeStart?: string;
  startTime?: string;
  preferredTimeEnd?: string;
  endTime?: string;
  terminalName?: string;
  terminalCode?: string;
  licensePlate?: string;
  truckType?: string;
  truckClass?: string;
  // Backend returns containerNumbers array
  containerNumbers?: string[];
  containerCount?: number;
  // Backend returns containers array with details
  containers?: Array<{
    containerNumber: string;
    containerType?: string;
    dimensions?: string;
    operationType?: string;
    isEmpty?: boolean;
  }>;
  driverName?: string;
  driverPhone?: string;
  driverIdNumber?: string;
  wasAutoValidated?: boolean;
  bookedAt?: number;
  confirmedAt?: number;
  cancelledAt?: number;
  consumedAt?: number;
  rejectedAt?: number;
  statusReason?: string;
  qrCode?: string;
  gateName?: string | null;
  gateCode?: string | null;
}

// Helper to normalize booking details
function normalizeBookingDetails(result: unknown): BookingDetails | null {
  if (!result || typeof result !== "object") return null;
  const r = result as BookingDetails;
  return {
    ...r,
    // Normalize date/time fields
    preferredDate: r.preferredDate || r.date,
    preferredTimeStart: r.preferredTimeStart || r.startTime,
    preferredTimeEnd: r.preferredTimeEnd || r.endTime,
    // Normalize container numbers
    containerNumbers: r.containerNumbers || r.containers?.map(c => c.containerNumber) || [],
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  confirmed: "bg-green-500/20 text-green-700 border-green-500/30",
  consumed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  rejected: "bg-red-500/20 text-red-700 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirme",
  consumed: "Consomme",
  cancelled: "Annule",
  expired: "Expire",
  rejected: "Refuse",
};

type BookingDetailsRendererProps =
  | ToolRendererProps<BookingDetails>
  | InteractiveToolRendererProps<BookingDetails>;

function isInteractive(
  props: BookingDetailsRendererProps
): props is InteractiveToolRendererProps<BookingDetails> {
  return "onAction" in props && typeof props.onAction === "function";
}

export function BookingDetailsRenderer(props: BookingDetailsRendererProps) {
  const { result, state } = props;
  const toolUI = useToolUIOptional();

  // Get handlers
  const onAction = isInteractive(props)
    ? props.onAction
    : toolUI?.handleAction ?? (() => {});

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4 animate-pulse" />
            Chargement des details...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (state === "error" || !result) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des details
        </CardContent>
      </Card>
    );
  }

  // Normalize the result
  const booking = normalizeBookingDetails(result);
  if (!booking) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Reservation introuvable
        </CardContent>
      </Card>
    );
  }

  const canCancel = ["pending", "confirmed"].includes(booking.status);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4" />
            {booking.bookingReference}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("text-xs", STATUS_COLORS[booking.status])}
          >
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {booking.preferredDate}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Creneau</p>
            <p className="text-sm flex items-center gap-1">
              <ClockIcon className="size-3" />
              {booking.preferredTimeStart} - {booking.preferredTimeEnd}
            </p>
          </div>
        </div>

        {/* Terminal */}
        {booking.terminalName && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Terminal</p>
            <p className="text-sm flex items-center gap-1">
              <MapPinIcon className="size-3" />
              {booking.terminalName}
              {booking.terminalCode && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {booking.terminalCode}
                </Badge>
              )}
            </p>
          </div>
        )}

        {/* Truck */}
        {booking.licensePlate && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Camion</p>
            <p className="text-sm flex items-center gap-1">
              <TruckIcon className="size-3" />
              {booking.licensePlate}
              {booking.truckType && (
                <span className="text-muted-foreground">({booking.truckType})</span>
              )}
            </p>
          </div>
        )}

        {/* Containers */}
        {booking.containerNumbers && booking.containerNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Conteneurs</p>
            <div className="flex flex-wrap gap-1">
              {booking.containerNumbers.map((num) => (
                <Badge key={num} variant="outline" className="text-xs font-mono">
                  <PackageIcon className="size-3 mr-1" />
                  {num}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Driver */}
        {(booking.driverName || booking.driverPhone) && (
          <div className="grid grid-cols-2 gap-4">
            {booking.driverName && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chauffeur</p>
                <p className="text-sm flex items-center gap-1">
                  <UserIcon className="size-3" />
                  {booking.driverName}
                </p>
              </div>
            )}
            {booking.driverPhone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Telephone</p>
                <p className="text-sm flex items-center gap-1">
                  <PhoneIcon className="size-3" />
                  {booking.driverPhone}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto-validation badge */}
        {booking.wasAutoValidated !== undefined && (
          <div className="pt-2 border-t border-border/50">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                booking.wasAutoValidated
                  ? "bg-green-500/10 text-green-700"
                  : "bg-amber-500/10 text-amber-700"
              )}
            >
              {booking.wasAutoValidated ? (
                <>
                  <CheckCircleIcon className="size-3 mr-1" />
                  Auto-valide
                </>
              ) : (
                <>
                  <XCircleIcon className="size-3 mr-1" />
                  Validation manuelle requise
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Status reason */}
        {booking.statusReason && (
          <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <p className="italic">Raison: {booking.statusReason}</p>
          </div>
        )}

        {/* Action buttons */}
        {canCancel && (
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 text-destructive hover:bg-destructive/10"
              onClick={() =>
                onAction({
                  type: "cancel-booking",
                  label: "Annuler",
                  payload: { bookingReference: booking.bookingReference },
                  variant: "destructive",
                })
              }
            >
              <XCircleIcon className="size-3 mr-1" />
              Annuler cette reservation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
