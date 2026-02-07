import { createFileRoute } from "@tanstack/react-router";
import {
  TerminalSelector,
  PendingQueue,
  useTerminalSelector,
} from "@/features/operator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/operator/pending")({
  component: OperatorPending,
});

function OperatorPending() {
  const { terminals, selectedTerminalId, selectedTerminal, selectTerminal, isLoading } =
    useTerminalSelector();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">En attente d'approbation</h1>
          <p className="text-muted-foreground">
            Reservations a valider pour {selectedTerminal?.name ?? "..."}
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
