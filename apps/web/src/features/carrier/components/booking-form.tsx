"use client";

import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  PackageIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { format, addDays, startOfDay } from "date-fns";

interface BookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BookingForm({ onSuccess, onCancel }: BookingFormProps) {
  const createBooking = useMutation(api.bookings.mutations.create);

  // Form state for dependent queries
  const [selectedTerminalId, setSelectedTerminalId] = useState<
    Id<"terminals"> | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Queries
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });
  const trucks = useQuery(api.trucks.queries.listMyTrucks, { activeOnly: true });
  const containers = useQuery(api.containers.queries.listAvailable, {});

  // Get available slots when terminal and date are selected
  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;
  const availableSlots = useQuery(
    api.timeSlots.queries.getAvailableSlots,
    selectedTerminalId && formattedDate
      ? { terminalId: selectedTerminalId, date: formattedDate }
      : "skip"
  );

  // Date constraints: min 2 hours from now, max 30 days ahead
  const minDate = startOfDay(new Date());
  const maxDate = addDays(new Date(), 30);

  const form = useForm({
    defaultValues: {
      terminalId: "" as string,
      truckId: "" as string,
      containerIds: [] as string[],
      preferredDate: "",
      preferredTimeStart: "",
      preferredTimeEnd: "",
      driverName: "",
      driverPhone: "",
      driverIdNumber: "",
    },
    onSubmit: async ({ value }) => {
      // Validation
      if (!value.terminalId) {
        toast.error("Veuillez selectionner un terminal");
        return;
      }
      if (!value.preferredDate) {
        toast.error("Veuillez selectionner une date");
        return;
      }
      if (!value.preferredTimeStart || !value.preferredTimeEnd) {
        toast.error("Veuillez selectionner un creneau horaire");
        return;
      }
      if (!value.truckId) {
        toast.error("Veuillez selectionner un camion");
        return;
      }
      if (value.containerIds.length === 0) {
        toast.error("Veuillez selectionner au moins un conteneur");
        return;
      }

      try {
        await createBooking({
          terminalId: value.terminalId as Id<"terminals">,
          truckId: value.truckId as Id<"trucks">,
          containerIds: value.containerIds as Id<"containers">[],
          preferredDate: value.preferredDate,
          preferredTimeStart: value.preferredTimeStart,
          preferredTimeEnd: value.preferredTimeEnd,
          driverName: value.driverName || undefined,
          driverPhone: value.driverPhone || undefined,
          driverIdNumber: value.driverIdNumber || undefined,
        });
        toast.success("Reservation creee avec succes");
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Echec de la creation de la reservation";
        toast.error(message);
      }
    },
  });

  // Handle terminal change - reset dependent fields
  const handleTerminalChange = (terminalId: string) => {
    form.setFieldValue("terminalId", terminalId);
    form.setFieldValue("preferredTimeStart", "");
    form.setFieldValue("preferredTimeEnd", "");
    setSelectedTerminalId(terminalId as Id<"terminals">);
  };

  // Handle date change - reset time slot
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    form.setFieldValue("preferredDate", date ? format(date, "yyyy-MM-dd") : "");
    form.setFieldValue("preferredTimeStart", "");
    form.setFieldValue("preferredTimeEnd", "");
  };

  // Handle slot selection
  const handleSlotSelect = (startTime: string, endTime: string) => {
    form.setFieldValue("preferredTimeStart", startTime);
    form.setFieldValue("preferredTimeEnd", endTime);
  };

  // Handle container toggle
  const handleContainerToggle = (containerId: string, checked: boolean) => {
    const currentIds = form.getFieldValue("containerIds");
    if (checked) {
      form.setFieldValue("containerIds", [...currentIds, containerId]);
    } else {
      form.setFieldValue(
        "containerIds",
        currentIds.filter((id) => id !== containerId)
      );
    }
  };

  const isLoading =
    terminals === undefined ||
    trucks === undefined ||
    containers === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Section 1: Terminal Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageIcon className="size-4" />
            Terminal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="terminalId">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Terminal *</FieldLabel>
                <FieldContent>
                  <Select
                    value={field.state.value}
                    onValueChange={handleTerminalChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selectionner un terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminals.map((terminal) => (
                        <SelectItem key={terminal._id} value={terminal._id}>
                          {terminal.name} ({terminal.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Section 2: Date & Time Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="size-4" />
            Date et creneau
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Picker */}
          <form.Field name="preferredDate">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Date *</FieldLabel>
                <FieldContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                        disabled={!selectedTerminalId}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {selectedDate
                          ? format(selectedDate, "PPP", { locale: fr })
                          : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateChange}
                        disabled={(date) => date < minDate || date > maxDate}
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {!selectedTerminalId && (
                    <FieldDescription>
                      Selectionnez d'abord un terminal
                    </FieldDescription>
                  )}
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          {/* Time Slot Grid */}
          {selectedTerminalId && selectedDate && (
            <form.Field name="preferredTimeStart">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel className="flex items-center gap-2">
                    <ClockIcon className="size-4" />
                    Creneau horaire *
                  </FieldLabel>
                  <FieldContent>
                    {availableSlots === undefined ? (
                      <div className="flex items-center gap-2 py-4">
                        <Spinner className="size-4" />
                        <span className="text-sm text-muted-foreground">
                          Chargement des creneaux...
                        </span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Aucun creneau disponible pour cette date
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                        {availableSlots.map((slot) => {
                          const isSelected =
                            field.state.value === slot.startTime;
                          return (
                            <button
                              key={slot._id}
                              type="button"
                              className={cn(
                                "rounded-md border p-2 text-center text-sm transition-colors",
                                "hover:bg-primary/10 hover:border-primary",
                                isSelected &&
                                  "bg-primary text-primary-foreground border-primary"
                              )}
                              onClick={() =>
                                handleSlotSelect(slot.startTime, slot.endTime)
                              }
                            >
                              <div className="font-medium">{slot.startTime}</div>
                              <div className="text-xs opacity-70">
                                {slot.availableCapacity} places
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Truck Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TruckIcon className="size-4" />
            Camion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="truckId">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Camion *</FieldLabel>
                <FieldContent>
                  {trucks.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Aucun camion disponible. Veuillez d'abord enregistrer un
                      camion.
                    </div>
                  ) : (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectionner un camion" />
                      </SelectTrigger>
                      <SelectContent>
                        {trucks.map((truck) => (
                          <SelectItem key={truck._id} value={truck._id}>
                            {truck.licensePlate} - {truck.truckType} (
                            {truck.truckClass})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Section 4: Container Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageIcon className="size-4" />
            Conteneurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="containerIds">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Conteneurs * (selectionnez un ou plusieurs)</FieldLabel>
                <FieldContent>
                  {containers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Aucun conteneur disponible. Tous vos conteneurs sont deja
                      reserves.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-2">
                      {containers.map((container) => {
                        const isChecked = field.state.value.includes(
                          container._id
                        );
                        return (
                          <label
                            key={container._id}
                            className={cn(
                              "flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors",
                              "hover:bg-muted",
                              isChecked && "bg-primary/10"
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleContainerToggle(
                                  container._id,
                                  checked === true
                                )
                              }
                            />
                            <div className="flex-1">
                              <span className="font-mono text-sm">
                                {container.containerNumber}
                              </span>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {container.containerType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {container.dimensions}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {container.operationType === "pick_up"
                                    ? "Retrait"
                                    : "Depot"}
                                </Badge>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {field.state.value.length > 0 && (
                    <FieldDescription>
                      {field.state.value.length} conteneur(s) selectionne(s)
                    </FieldDescription>
                  )}
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Section 5: Driver Info (Optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="size-4" />
            Informations chauffeur (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="driverName">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Nom du chauffeur</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Jean Dupont"
                    />
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="driverPhone">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Telephone</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="tel"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="driverIdNumber">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Numero de piece d'identite
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="AB123456"
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
              {isSubmitting ? "Creation..." : "Creer la reservation"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
