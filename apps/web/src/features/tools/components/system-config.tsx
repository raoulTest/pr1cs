"use client";

import type { ToolRendererProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsIcon, ClockIcon, CalendarIcon, TruckIcon } from "lucide-react";

interface SystemConfig {
  maxBookingsPerDay?: number;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
  autoValidationThreshold?: number;
  defaultAutoValidationThreshold?: number;
  cancellationDeadlineHours?: number;
  noShowGracePeriodMinutes?: number;
  reminderHoursBefore?: number;
  maxContainersPerBooking?: number;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  workingDays?: number[];
}

// Helper to normalize config result
function normalizeConfigResult(result: unknown): SystemConfig | null {
  if (!result) return null;
  
  // If result is already a config object (direct return from backend)
  if (typeof result === "object" && ("maxAdvanceBookingDays" in result || "minAdvanceBookingHours" in result || "defaultAutoValidationThreshold" in result)) {
    return result as SystemConfig;
  }
  
  // If wrapped in { config: ... }
  if (result && typeof result === "object" && "config" in result) {
    return (result as { config: SystemConfig }).config;
  }
  
  return null;
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

export function SystemConfigRenderer({ result, state }: ToolRendererProps<unknown>) {
  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <SettingsIcon className="size-4 animate-pulse" />
            Chargement de la configuration...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const config = normalizeConfigResult(result);

  if (state === "error" || !config) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement de la configuration
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <SettingsIcon className="size-4" />
          Configuration systeme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operating Hours */}
        {(config.operatingHoursStart || config.operatingHoursEnd) && (
          <div className="flex items-center gap-4">
            <ClockIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Horaires d'ouverture</p>
              <p className="text-sm">
                {config.operatingHoursStart || "08:00"} - {config.operatingHoursEnd || "18:00"}
              </p>
            </div>
          </div>
        )}

        {/* Working Days */}
        {config.workingDays && config.workingDays.length > 0 && (
          <div className="flex items-start gap-4">
            <CalendarIcon className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Jours ouvres</p>
              <p className="text-sm">
                {config.workingDays.map((day) => WEEKDAY_LABELS[day]).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Booking Limits */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          {config.maxBookingsPerDay && (
            <div>
              <p className="text-xs text-muted-foreground">Max reservations/jour</p>
              <p className="text-sm font-medium">{config.maxBookingsPerDay}</p>
            </div>
          )}
          {config.maxAdvanceBookingDays && (
            <div>
              <p className="text-xs text-muted-foreground">Reservation max a l'avance</p>
              <p className="text-sm font-medium">{config.maxAdvanceBookingDays} jours</p>
            </div>
          )}
          {config.minAdvanceBookingHours && (
            <div>
              <p className="text-xs text-muted-foreground">Delai minimum</p>
              <p className="text-sm font-medium">{config.minAdvanceBookingHours}h</p>
            </div>
          )}
          {config.cancellationDeadlineHours && (
            <div>
              <p className="text-xs text-muted-foreground">Delai annulation</p>
              <p className="text-sm font-medium">{config.cancellationDeadlineHours}h avant</p>
            </div>
          )}
        </div>

        {/* Auto-validation */}
        {(config.autoValidationThreshold || config.defaultAutoValidationThreshold) && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <TruckIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Seuil d'auto-validation</p>
              <p className="text-sm">
                {config.autoValidationThreshold || config.defaultAutoValidationThreshold}% de la capacite
              </p>
            </div>
          </div>
        )}

        {/* Additional settings from backend */}
        {config.noShowGracePeriodMinutes && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <ClockIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Delai de grace (no-show)</p>
              <p className="text-sm">{config.noShowGracePeriodMinutes} minutes</p>
            </div>
          </div>
        )}

        {config.maxContainersPerBooking && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <TruckIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Conteneurs max par reservation</p>
              <p className="text-sm">{config.maxContainersPerBooking}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
