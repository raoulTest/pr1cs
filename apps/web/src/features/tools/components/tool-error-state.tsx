"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

interface ToolErrorStateProps {
  toolName: string;
  error: string;
  onRetry?: () => void;
}

const TOOL_ERROR_MESSAGES: Record<string, string> = {
  listMyBookings: "Impossible de charger les reservations",
  getBookingDetails: "Impossible de charger les details de la reservation",
  listBookingsByTerminal: "Impossible de charger les reservations du terminal",
  listBookingsByCarrier: "Impossible de charger les reservations du transporteur",
  listPendingBookings: "Impossible de charger les reservations en attente",
  listAllBookings: "Impossible de charger les reservations",
  listTerminals: "Impossible de charger les terminaux",
  getTerminalDetails: "Impossible de charger les details du terminal",
  getAvailableSlots: "Impossible de rechercher les creneaux disponibles",
  suggestOptimalSlots: "Impossible de calculer les meilleurs creneaux",
  listMyContainers: "Impossible de charger les conteneurs",
  getContainerDetails: "Impossible de charger les details du conteneur",
  listMyTrucks: "Impossible de charger les camions",
  getSystemConfig: "Impossible de charger la configuration",
  createBookingViaAI: "Impossible de creer la reservation",
  cancelBookingViaAI: "Impossible d'annuler la reservation",
};

export function ToolErrorState({ toolName, error, onRetry }: ToolErrorStateProps) {
  const defaultMessage = TOOL_ERROR_MESSAGES[toolName] || "Une erreur est survenue";

  return (
    <Card className="border-destructive/50 bg-destructive/5 animate-in fade-in-0 duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
          <AlertCircleIcon className="size-4" />
          {defaultMessage}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {error || "Veuillez reessayer ou contacter le support si le probleme persiste."}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onRetry}
          >
            <RefreshCwIcon className="size-3 mr-1" />
            Reessayer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
