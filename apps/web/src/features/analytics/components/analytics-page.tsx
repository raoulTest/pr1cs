import { useTerminalSelector, TerminalSelector } from "@/features/operator";
import { Skeleton } from "@/components/ui/skeleton";

import { BookingStatusChart } from "./booking-status-chart";
import { BookingTrendsChart } from "./booking-trends-chart";
import { TerminalComparisonChart } from "./terminal-comparison-chart";
import { HourlyDistributionChart } from "./hourly-distribution-chart";
import { ContainerTypeChart } from "./container-type-chart";
import { ContainerDimensionsChart } from "./container-dimensions-chart";
import { OperationsBalanceChart } from "./operations-balance-chart";
import { TruckFleetChart } from "./truck-fleet-chart";
import { TopCarriersChart } from "./top-carriers-chart";
import { SystemActivityChart } from "./system-activity-chart";
import { OperatorProcessingChart } from "./operator-processing-chart";

interface AnalyticsPageProps {
  role: "port_admin" | "terminal_operator";
}

export function AnalyticsPage({ role }: AnalyticsPageProps) {
  const isAdmin = role === "port_admin";
  const {
    terminals,
    selectedTerminalId,
    selectTerminal,
    isLoading: terminalsLoading,
  } = useTerminalSelector();

  if (terminalsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  // For operator, we need a selected terminal
  const terminalId = isAdmin ? undefined : selectedTerminalId ?? undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytiques</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Vue d'ensemble des performances du système"
              : "Statistiques du terminal"}
          </p>
        </div>
        {!isAdmin && (
          <TerminalSelector
            terminals={terminals}
            selectedTerminalId={selectedTerminalId}
            onSelect={selectTerminal}
            disabled={terminalsLoading}
          />
        )}
      </div>

      {/* Section: Vue d'ensemble */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Vue d'ensemble</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BookingStatusChart terminalId={terminalId} />
          <OperationsBalanceChart terminalId={terminalId} />
          {!isAdmin && selectedTerminalId && (
            <OperatorProcessingChart terminalId={selectedTerminalId} />
          )}
        </div>
      </section>

      {/* Section: Tendances */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Tendances</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BookingTrendsChart terminalId={terminalId} />
          <HourlyDistributionChart terminalId={terminalId} />
        </div>
      </section>

      {/* Section: Terminaux (admin only) */}
      {isAdmin && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Terminaux</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TerminalComparisonChart />
          </div>
        </section>
      )}

      {/* Section: Flotte & Conteneurs */}
      {isAdmin && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Flotte & Conteneurs
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ContainerTypeChart />
            <ContainerDimensionsChart />
            <TruckFleetChart />
          </div>
        </section>
      )}

      {/* Section: Transporteurs (admin only) */}
      {isAdmin && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Transporteurs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TopCarriersChart />
          </div>
        </section>
      )}

      {/* Section: Activité système (admin only) */}
      {isAdmin && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Activité système</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SystemActivityChart />
          </div>
        </section>
      )}
    </div>
  );
}
