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
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingDetails {
  bookingReference: string;
  status: string;
  preferredDate: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  terminalName?: string;
  terminalCode?: string;
  licensePlate?: string;
  truckType?: string;
  containerNumbers?: string[];
  driverName?: string;
  driverPhone?: string;
  wasAutoValidated?: boolean;
  bookedAt?: number;
  confirmedAt?: number;
  cancelledAt?: number;
  statusReason?: string;
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

export function BookingDetailsRenderer({ result, state }: ToolRendererProps<BookingDetails>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4" />
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

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4" />
            {result.bookingReference}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("text-xs", STATUS_COLORS[result.status])}
          >
            {STATUS_LABELS[result.status] || result.status}
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
              {result.preferredDate}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Creneau</p>
            <p className="text-sm flex items-center gap-1">
              <ClockIcon className="size-3" />
              {result.preferredTimeStart} - {result.preferredTimeEnd}
            </p>
          </div>
        </div>

        {/* Terminal */}
        {result.terminalName && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Terminal</p>
            <p className="text-sm flex items-center gap-1">
              <MapPinIcon className="size-3" />
              {result.terminalName}
              {result.terminalCode && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {result.terminalCode}
                </Badge>
              )}
            </p>
          </div>
        )}

        {/* Truck */}
        {result.licensePlate && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Camion</p>
            <p className="text-sm flex items-center gap-1">
              <TruckIcon className="size-3" />
              {result.licensePlate}
              {result.truckType && (
                <span className="text-muted-foreground">({result.truckType})</span>
              )}
            </p>
          </div>
        )}

        {/* Containers */}
        {result.containerNumbers && result.containerNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Conteneurs</p>
            <div className="flex flex-wrap gap-1">
              {result.containerNumbers.map((num) => (
                <Badge key={num} variant="outline" className="text-xs font-mono">
                  <PackageIcon className="size-3 mr-1" />
                  {num}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Driver */}
        {(result.driverName || result.driverPhone) && (
          <div className="grid grid-cols-2 gap-4">
            {result.driverName && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chauffeur</p>
                <p className="text-sm flex items-center gap-1">
                  <UserIcon className="size-3" />
                  {result.driverName}
                </p>
              </div>
            )}
            {result.driverPhone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Telephone</p>
                <p className="text-sm flex items-center gap-1">
                  <PhoneIcon className="size-3" />
                  {result.driverPhone}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto-validation badge */}
        {result.wasAutoValidated !== undefined && (
          <div className="pt-2 border-t border-border/50">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                result.wasAutoValidated
                  ? "bg-green-500/10 text-green-700"
                  : "bg-amber-500/10 text-amber-700"
              )}
            >
              {result.wasAutoValidated ? (
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
        {result.statusReason && (
          <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <p className="italic">Raison: {result.statusReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
