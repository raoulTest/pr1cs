import { createFileRoute, redirect } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
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

export const Route = createFileRoute("/operator/")({
  component: OperatorDashboard,
});

function OperatorDashboard() {
  return (
    <>
      <Authenticated>
        <OperatorDashboardContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

function OperatorDashboardContent() {
  const { terminals, selectedTerminalId, selectedTerminal, selectTerminal, isLoading } =
    useTerminalSelector();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Tableau de bord opérateur pour {selectedTerminal?.name ?? "..."}
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
              Gérer les réservations en attente d'approbation
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
              Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulter toutes les réservations du terminal
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/operator/bookings">Voir les réservations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GridIcon className="size-5 text-emerald-500" />
              Capacité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gérer la capacité hebdomadaire du terminal
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/operator/capacity">Gérer la capacité</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes récentes en attente</CardTitle>
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
