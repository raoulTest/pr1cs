"use client";

import type { ToolRendererProps, InteractiveToolRendererProps, ToolAction } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  PackageIcon,
  MapPinIcon,
  EyeIcon,
  XCircleIcon,
  ExpandIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolUIOptional } from "../context/tool-ui-context";

interface Booking {
  bookingReference: string;
  status: string;
  preferredDate: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  // Alternate field names from backend enrichBookings()
  date?: string;
  startTime?: string;
  endTime?: string;
  terminalName?: string;
  terminalCode?: string;
  licensePlate?: string;
  containerCount?: number;
  wasAutoValidated?: boolean;
}

interface BookingListResult {
  bookings: Booking[];
  total?: number;
}

// Helper to normalize a single booking's field names
function normalizeBooking(b: Booking): Booking {
  return {
    ...b,
    preferredDate: b.preferredDate || b.date || "",
    preferredTimeStart: b.preferredTimeStart || b.startTime || "",
    preferredTimeEnd: b.preferredTimeEnd || b.endTime || "",
  };
}

// Helper to normalize result - handles both array and object formats
function normalizeBookingResult(result: unknown): BookingListResult {
  // If result is an array, wrap it
  if (Array.isArray(result)) {
    const bookings = (result as Booking[]).map(normalizeBooking);
    return { bookings, total: bookings.length };
  }
  // If result is an object with bookings property
  if (result && typeof result === "object" && "bookings" in result) {
    const r = result as BookingListResult;
    const bookings = (r.bookings || []).map(normalizeBooking);
    return { bookings, total: r.total || bookings.length };
  }
  // Fallback - empty
  return { bookings: [], total: 0 };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  confirmed: "bg-green-500/20 text-green-700 border-green-500/30",
  consumed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  rejected: "bg-red-500/20 text-red-700 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirme",
  consumed: "Consomme",
  cancelled: "Annule",
  expired: "Expire",
  rejected: "Refuse",
};

type BookingListRendererProps =
  | ToolRendererProps<BookingListResult>
  | (InteractiveToolRendererProps<BookingListResult> & {
      previewOnly?: boolean;
      previewCount?: number;
      expanded?: boolean;
    });

function isInteractive(
  props: BookingListRendererProps
): props is InteractiveToolRendererProps<BookingListResult> {
  return "onAction" in props && typeof props.onAction === "function";
}

export function BookingListRenderer(props: BookingListRendererProps) {
  const { result, state } = props;
  const toolUI = useToolUIOptional();

  // Get props with defaults
  const previewOnly = "previewOnly" in props ? props.previewOnly : false;
  const previewCount = "previewCount" in props ? props.previewCount : 3;

  // Get handlers
  const onAction = isInteractive(props)
    ? props.onAction
    : toolUI?.handleAction ?? (() => {});

  const openExpandSheet = toolUI?.openExpandSheet;

  if (state === "running") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="size-4 animate-pulse" />
            Chargement des reservations...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Normalize the result to handle both array and object formats
  const normalized = normalizeBookingResult(result);
  
  if (state === "error" || normalized.bookings.length === 0 && !result) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Erreur lors du chargement des reservations
        </CardContent>
      </Card>
    );
  }

  const { bookings, total } = normalized;
  const displayBookings = previewOnly
    ? bookings.slice(0, previewCount)
    : bookings;
  const hasMore = bookings.length > (previewCount ?? 3);

  if (bookings.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <CalendarIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune reservation trouvee</p>
        </CardContent>
      </Card>
    );
  }

  const handleExpand = () => {
    if (!openExpandSheet) return;

    openExpandSheet({
      title: `Reservations (${total || bookings.length})`,
      toolName: props.toolName,
      toolCallId: isInteractive(props) ? props.toolCallId : `booking-list-${Date.now()}`,
      result,
      renderFullContent: () => (
        <BookingListRenderer {...props} previewOnly={false} expanded />
      ),
    });
  };

  const getBookingActions = (booking: Booking): ToolAction[] => {
    const actions: ToolAction[] = [
      {
        type: "view-details",
        label: "Voir details",
        payload: { bookingReference: booking.bookingReference },
      },
    ];

    // Only show cancel for pending/confirmed bookings
    if (["pending", "confirmed"].includes(booking.status)) {
      actions.push({
        type: "cancel-booking",
        label: "Annuler",
        payload: { bookingReference: booking.bookingReference },
        variant: "destructive",
      });
    }

    return actions;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="size-4" />
          <span>Reservations</span>
          {(total || bookings.length > 0) && (
            <Badge variant="secondary" className="text-xs">
              {total || bookings.length}
            </Badge>
          )}
        </CardTitle>
        {previewOnly && hasMore && openExpandSheet && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleExpand}
              title="Voir tout"
            >
              <ExpandIcon className="size-4" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {displayBookings.map((booking) => {
          const actions = getBookingActions(booking);
          const canCancel = ["pending", "confirmed"].includes(booking.status);

          return (
            <div
              key={booking.bookingReference}
              className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">
                  {booking.bookingReference}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", STATUS_COLORS[booking.status])}
                >
                  {STATUS_LABELS[booking.status] || booking.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {booking.preferredDate}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {booking.preferredTimeStart} - {booking.preferredTimeEnd}
                </span>
                {booking.terminalName && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3" />
                    {booking.terminalName}
                  </span>
                )}
                {booking.licensePlate && (
                  <span className="flex items-center gap-1">
                    <TruckIcon className="size-3" />
                    {booking.licensePlate}
                  </span>
                )}
                {booking.containerCount && (
                  <span className="flex items-center gap-1">
                    <PackageIcon className="size-3" />
                    {booking.containerCount} conteneur(s)
                  </span>
                )}
              </div>

              {/* Action buttons row - show for pending/confirmed bookings when not in preview mode */}
              {!previewOnly && (
                <div className="flex gap-2 pt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onAction(actions[0])}
                  >
                    <EyeIcon className="size-3 mr-1" />
                    Details
                  </Button>
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        onAction({
                          type: "cancel-booking",
                          label: "Annuler",
                          payload: { bookingReference: booking.bookingReference },
                          variant: "destructive",
                        })
                      }
                    >
                      <XCircleIcon className="size-3 mr-1" />
                      Annuler
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Show hint for preview mode */}
        {previewOnly && hasMore && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{bookings.length - (previewCount ?? 3)} autres reservations
          </p>
        )}
      </CardContent>
    </Card>
  );
}
