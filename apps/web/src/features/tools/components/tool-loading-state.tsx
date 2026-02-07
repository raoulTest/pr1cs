"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  SettingsIcon,
  WrenchIcon,
} from "lucide-react";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  listMyBookings: <CalendarIcon className="size-4" />,
  getBookingDetails: <CalendarIcon className="size-4" />,
  listBookingsByTerminal: <CalendarIcon className="size-4" />,
  listBookingsByCarrier: <CalendarIcon className="size-4" />,
  listPendingBookings: <CalendarIcon className="size-4" />,
  listAllBookings: <CalendarIcon className="size-4" />,
  listTerminals: <MapPinIcon className="size-4" />,
  getTerminalDetails: <MapPinIcon className="size-4" />,
  getAvailableSlots: <ClockIcon className="size-4" />,
  suggestOptimalSlots: <ClockIcon className="size-4" />,
  listMyContainers: <PackageIcon className="size-4" />,
  getContainerDetails: <PackageIcon className="size-4" />,
  listMyTrucks: <TruckIcon className="size-4" />,
  getSystemConfig: <SettingsIcon className="size-4" />,
  createBookingViaAI: <CalendarIcon className="size-4" />,
  cancelBookingViaAI: <CalendarIcon className="size-4" />,
};

const TOOL_LABELS: Record<string, string> = {
  listMyBookings: "Chargement des reservations...",
  getBookingDetails: "Chargement des details...",
  listBookingsByTerminal: "Chargement des reservations...",
  listBookingsByCarrier: "Chargement des reservations...",
  listPendingBookings: "Chargement des reservations en attente...",
  listAllBookings: "Chargement de toutes les reservations...",
  listTerminals: "Chargement des terminaux...",
  getTerminalDetails: "Chargement des details du terminal...",
  getAvailableSlots: "Recherche des creneaux disponibles...",
  suggestOptimalSlots: "Recherche des meilleurs creneaux...",
  listMyContainers: "Chargement des conteneurs...",
  getContainerDetails: "Chargement des details du conteneur...",
  listMyTrucks: "Chargement des camions...",
  getSystemConfig: "Chargement de la configuration...",
  createBookingViaAI: "Creation de la reservation...",
  cancelBookingViaAI: "Annulation de la reservation...",
};

interface ToolLoadingStateProps {
  toolName: string;
}

export function ToolLoadingState({ toolName }: ToolLoadingStateProps) {
  const icon = TOOL_ICONS[toolName] || <WrenchIcon className="size-4" />;
  const label = TOOL_LABELS[toolName] || "Traitement en cours...";

  // Different skeleton layouts based on tool type
  const isListTool =
    toolName.startsWith("list") || toolName.includes("Bookings");
  const isDetailTool = toolName.includes("Details") || toolName === "getSystemConfig";
  const isSlotTool =
    toolName === "getAvailableSlots" || toolName === "suggestOptimalSlots";

  return (
    <Card className="border-border/50 animate-in fade-in-0 duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="animate-pulse">{icon}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isSlotTool ? (
          // Grid layout for slots
          <>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </>
        ) : isListTool ? (
          // List layout
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/30 p-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : isDetailTool ? (
          // Detail layout
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Generic layout
          [1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))
        )}
      </CardContent>
    </Card>
  );
}
