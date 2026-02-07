"use client";

import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  TruckIcon,
  ContainerIcon,
  ClockIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BookingStatus = "pending" | "confirmed" | "rejected" | "consumed" | "cancelled" | "expired";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  rejected: "Refusee",
  consumed: "Consommee",
  cancelled: "Annulee",
  expired: "Expiree",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  consumed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

interface Booking {
  _id: string;
  bookingReference: string;
  status: BookingStatus;
  preferredDate: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  terminalName: string;
  licensePlate: string;
  containerCount: number;
  driverName?: string;
}

const MONTHS_FR = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const bookings = useQuery(api.bookings.queries.listMyBookings, { limit: 100 });

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    if (!bookings) return new Map<string, Booking[]>();
    
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const date = booking.preferredDate;
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(booking as Booking);
    });
    return map;
  }, [bookings]);

  // Calendar generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust to start on Monday (European format)
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Next month padding to complete the grid (6 rows)
    while (days.length < 42) {
      const nextDay = days.length - startPadding - lastDay.getDate() + 1;
      days.push({ date: new Date(year, month + 1, nextDay), isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const selectedDateBookings = selectedDate ? bookingsByDate.get(selectedDate) || [] : [];

  if (bookings === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5" />
              Calendrier des reservations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="min-w-[160px] text-center font-medium">
                {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {DAYS_FR.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dateKey = formatDateKey(date);
              const dayBookings = bookingsByDate.get(dateKey) || [];
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "relative min-h-[80px] p-2 text-left rounded-md border transition-all",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                    isCurrentMonth
                      ? "bg-background"
                      : "bg-muted/30 text-muted-foreground",
                    isToday(date) && "ring-2 ring-primary",
                    selectedDate === dateKey && "bg-primary/10"
                  )}
                  onClick={() => setSelectedDate(hasBookings ? dateKey : null)}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary"
                  )}>
                    {date.getDate()}
                  </span>

                  {/* Booking indicators */}
                  {hasBookings && (
                    <div className="mt-1 space-y-1">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking._id}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate border",
                            STATUS_COLORS[booking.status]
                          )}
                        >
                          {booking.preferredTimeStart}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayBookings.length - 2} autres
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-amber-100 border border-amber-200" />
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-emerald-100 border border-emerald-200" />
              <span>Confirmee</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-blue-100 border border-blue-200" />
              <span>Consommee</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Detail Panel */}
      {selectedDate && selectedDateBookings.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              Reservations du {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDateBookings.map((booking) => (
              <button
                key={booking._id}
                type="button"
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {booking.bookingReference}
                    </Badge>
                    <Badge className={cn("border", STATUS_COLORS[booking.status])}>
                      {STATUS_LABELS[booking.status]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {booking.preferredTimeStart} - {booking.preferredTimeEnd}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TruckIcon className="size-3" />
                    {booking.licensePlate}
                  </span>
                  <span className="flex items-center gap-1">
                    <ContainerIcon className="size-3" />
                    {booking.containerCount} conteneur(s)
                  </span>
                  <span>{booking.terminalName}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reservation {selectedBooking?.bookingReference}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={cn("border", STATUS_COLORS[selectedBooking.status])}>
                  {STATUS_LABELS[selectedBooking.status]}
                </Badge>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span>{selectedBooking.preferredDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <span>
                    {selectedBooking.preferredTimeStart} - {selectedBooking.preferredTimeEnd}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TruckIcon className="size-4 text-muted-foreground" />
                  <span>{selectedBooking.licensePlate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ContainerIcon className="size-4 text-muted-foreground" />
                  <span>{selectedBooking.containerCount} conteneur(s)</span>
                </div>
              </div>

              {selectedBooking.driverName && (
                <div>
                  <p className="text-sm text-muted-foreground">Chauffeur</p>
                  <p className="font-medium">{selectedBooking.driverName}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Terminal</p>
                <p className="font-medium">{selectedBooking.terminalName}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
