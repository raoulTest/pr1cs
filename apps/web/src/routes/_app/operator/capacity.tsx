import { createFileRoute } from "@tanstack/react-router";
import {
  TerminalSelector,
  CapacityGrid,
  useTerminalSelector,
} from "@/features/operator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/operator/capacity")({
  component: OperatorCapacity,
});

function OperatorCapacity() {
  const { terminals, selectedTerminalId, selectedTerminal, selectTerminal, isLoading } =
    useTerminalSelector();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion de la capacite</h1>
          <p className="text-muted-foreground">
            Grille hebdomadaire pour {selectedTerminal?.name ?? "..."}
          </p>
        </div>
        <TerminalSelector
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onSelect={selectTerminal}
          disabled={isLoading}
        />
      </div>

      {/* Capacity Grid */}
      <CapacityGrid terminalId={selectedTerminalId} />
    </div>
  );
}
