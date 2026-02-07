import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
  TerminalSelector,
  PendingQueue,
  useTerminalSelector,
} from "@/features/operator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/operator/pending")({
  component: OperatorPending,
});

function OperatorPending() {
  return (
    <>
      <Authenticated>
        <OperatorPendingContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AuthLoading>
    </>
  );
}

function OperatorPendingContent() {
  const { terminals, selectedTerminalId, selectedTerminal, selectTerminal, isLoading } =
    useTerminalSelector();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">En attente d'approbation</h1>
          <p className="text-muted-foreground">
            Réservations à valider pour {selectedTerminal?.name ?? "..."}
          </p>
        </div>
        <TerminalSelector
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onSelect={selectTerminal}
          disabled={isLoading}
        />
      </div>

      {/* Pending Queue */}
      <PendingQueue terminalId={selectedTerminalId} />
    </div>
  );
}
