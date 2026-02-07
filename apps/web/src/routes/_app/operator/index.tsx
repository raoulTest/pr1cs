import { createFileRoute } from "@tanstack/react-router";
import {
  TerminalSelector,
  DashboardStats,
  PendingQueue,
  useTerminalSelector,
} from "@/features/operator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ClockIcon, CalendarIcon, GridIcon } from "lucide-react";

export const Route = createFileRoute("/_app/operator/")({
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { terminals, selectedTerminalId, selectedTerminal, selectTerminal, isLoading } =
    useTerminalSelector();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Tableau de bord operateur pour {selectedTerminal?.name ?? "..."}
          </p>
        </div>
        <TerminalSelector
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onSelect={selectTerminal}
          disabled={isLoading}
        />
      </div>

      {/* Stats */}
      <DashboardStats terminalId={selectedTerminalId} />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClockIcon className="size-5 text-amber-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerer les reservations en attente d'approbation
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/operator/pending">Voir les demandes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="size-5 text-blue-500" />
              Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulter toutes les reservations du terminal
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/operator/bookings">Voir les reservations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GridIcon className="size-5 text-emerald-500" />
              Capacite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerer la capacite hebdomadaire du terminal
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/operator/capacity">Gerer la capacite</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes recentes en attente</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/operator/pending">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PendingQueue terminalId={selectedTerminalId} />
        </CardContent>
      </Card>
    </div>
  );
}
