"use client";

import type { ToolRendererProps } from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  PackageIcon,
  MapPinIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  bookingReference: string;
  status: string;
  preferredDate: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  terminalName?: string;
  terminalCode?: string;
  licensePlate?: string;
  containerCount?: number;
  wasAutoValidated?: boolean;
}

interface BookingListResult {
  bookings: Booking[];
  total?: number;
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

export function BookingListRenderer({ result, state }: ToolRendererProps<BookingListResult>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4" />
            Chargement des reservations...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (state === "error" || !result?.bookings) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des reservations
        </CardContent>
      </Card>
    );
  }

  const { bookings, total } = result;

  if (bookings.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <CalendarIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune reservation trouvee</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-4" />
            Reservations
          </span>
          {total && (
            <Badge variant="secondary" className="text-xs">
              {total} total
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.bookingReference}
            className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">
                {booking.bookingReference}
              </span>
              <Badge
                variant="outline"
                className={cn("text-xs", STATUS_COLORS[booking.status])}
              >
                {STATUS_LABELS[booking.status] || booking.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {booking.preferredDate}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {booking.preferredTimeStart} - {booking.preferredTimeEnd}
              </span>
              {booking.terminalName && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {booking.terminalName}
                </span>
              )}
              {booking.licensePlate && (
                <span className="flex items-center gap-1">
                  <TruckIcon className="size-3" />
                  {booking.licensePlate}
                </span>
              )}
              {booking.containerCount && (
                <span className="flex items-center gap-1">
                  <PackageIcon className="size-3" />
                  {booking.containerCount} conteneur(s)
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
