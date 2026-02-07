import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import {
  BuildingIcon,
  DoorOpenIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });
  const carriers = useQuery(api.carriers.queries.listCarriers, { limit: 1000 });
  const trucks = useQuery(api.trucks.queries.listAll, { activeOnly: true });

  const isLoading = terminals === undefined || carriers === undefined || trucks === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Terminaux actifs",
      value: terminals?.length ?? 0,
      icon: BuildingIcon,
      color: "text-blue-500",
    },
    {
      title: "Transporteurs",
      value: carriers?.length ?? 0,
      icon: TruckIcon,
      color: "text-green-500",
    },
    {
      title: "Camions enregistres",
      value: trucks?.length ?? 0,
      icon: TruckIcon,
      color: "text-amber-500",
    },
    {
      title: "Portes totales",
      value: terminals?.reduce((acc, t) => acc + (t.gateCount ?? 0), 0) ?? 0,
      icon: DoorOpenIcon,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble du systeme APCS
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`size-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon className="size-5" />
              Terminaux recents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {terminals && terminals.length > 0 ? (
              <ul className="space-y-2">
                {terminals.slice(0, 5).map((terminal) => (
                  <li key={terminal._id} className="flex items-center justify-between text-sm">
                    <span>{terminal.name}</span>
                    <span className="text-muted-foreground">{terminal.code}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun terminal configure</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              Activite des transporteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carriers && carriers.length > 0 ? (
              <ul className="space-y-2">
                {carriers.slice(0, 5).map((carrier) => (
                  <li key={carrier.userId} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[200px]">{carrier.userId}</span>
                    <span className="text-muted-foreground">
                      {carrier.truckCount} camions, {carrier.bookingCount} reservations
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun transporteur inscrit</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
