"use client";

import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface BookingsListProps {
  terminalId: Id<"terminals"> | null;
}

type BookingStatus = "pending" | "confirmed" | "rejected" | "consumed" | "cancelled" | "expired";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  rejected: "Refusée",
  consumed: "Consommée",
  cancelled: "Annulée",
  expired: "Expirée",
};

const STATUS_VARIANTS: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  rejected: "destructive",
  consumed: "outline",
  cancelled: "destructive",
  expired: "outline",
};

export function BookingsList({ terminalId }: BookingsListProps) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const bookings = useQuery(
    api.bookings.queries.listByTerminal,
    terminalId
      ? {
          terminalId,
          status: statusFilter === "all" ? undefined : statusFilter,
          date: dateFilter || undefined,
          limit: 50,
        }
      : "skip"
  );

  if (!terminalId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sélectionnez un terminal pour voir les réservations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value: string) => setStatusFilter(value as BookingStatus | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="rejected">Refusée</SelectItem>
              <SelectItem value="consumed">Consommée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
              <SelectItem value="expired">Expirée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[180px]"
            placeholder="Filtrer par date"
          />
          {dateFilter && (
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setDateFilter("")}
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {bookings === undefined ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <SearchIcon className="mx-auto mb-4 size-12 opacity-50" />
            <p className="text-lg font-medium">Aucune réservation trouvée</p>
            <p className="text-sm">Essayez de modifier les filtres</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Horaire</TableHead>
                  <TableHead>Camion</TableHead>
                  <TableHead>Conteneurs</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-mono font-medium">
                      {booking.bookingReference}
                    </TableCell>
                    <TableCell>{booking.preferredDate}</TableCell>
                    <TableCell>
                      {booking.preferredTimeStart} - {booking.preferredTimeEnd}
                    </TableCell>
                    <TableCell>{booking.licensePlate}</TableCell>
                    <TableCell>{booking.containerCount}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[booking.status]}>
                        {STATUS_LABELS[booking.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
