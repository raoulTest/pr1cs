import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { SettingsIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_app/admin/config")({
  component: ConfigPage,
});

function ConfigPage() {
  const config = useQuery(api.config.queries.get);
  const updateConfig = useMutation(api.config.mutations.upsert);

  const form = useForm({
    defaultValues: {
      maxAdvanceBookingDays: config?.maxAdvanceBookingDays ?? 30,
      minAdvanceBookingHours: config?.minAdvanceBookingHours ?? 2,
      noShowGracePeriodMinutes: config?.noShowGracePeriodMinutes ?? 30,
      defaultAutoValidationThreshold: config?.defaultAutoValidationThreshold ?? 50,
      maxContainersPerBooking: config?.maxContainersPerBooking ?? 10,
      reminderHoursBefore: config?.reminderHoursBefore?.join(", ") ?? "24, 2",
    },
    onSubmit: async ({ value }) => {
      try {
        // Parse reminder hours
        const reminderHours = value.reminderHoursBefore
          .split(",")
          .map((h) => parseInt(h.trim(), 10))
          .filter((h) => !isNaN(h) && h > 0);

        await updateConfig({
          maxAdvanceBookingDays: value.maxAdvanceBookingDays,
          minAdvanceBookingHours: value.minAdvanceBookingHours,
          noShowGracePeriodMinutes: value.noShowGracePeriodMinutes,
          defaultAutoValidationThreshold: value.defaultAutoValidationThreshold,
          maxContainersPerBooking: value.maxContainersPerBooking,
          reminderHoursBefore: reminderHours,
        });
        toast.success("Configuration mise a jour avec succes");
      } catch (error) {
        toast.error("Erreur lors de la mise a jour de la configuration");
      }
    },
  });

  if (config === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="size-6" />
          Configuration systeme
        </h1>
        <p className="text-muted-foreground">
          Parametres globaux du systeme APCS
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Parametres de reservation</CardTitle>
            <CardDescription>
              Configurer les regles de reservation pour tous les terminaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <form.Field name="maxAdvanceBookingDays">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Reservation max a l'avance (jours)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={365}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>
                        Nombre maximum de jours a l'avance pour reserver
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="minAdvanceBookingHours">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Reservation min a l'avance (heures)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        max={72}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>
                        Delai minimum avant le creneau pour pouvoir reserver
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="noShowGracePeriodMinutes">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Periode de grace no-show (minutes)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        max={120}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>
                        Temps d'attente avant de marquer comme no-show
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="defaultAutoValidationThreshold">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Seuil auto-validation (%)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        max={100}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>
                        Pourcentage de capacite avant validation manuelle requise
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="maxContainersPerBooking">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Max conteneurs par reservation
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={50}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>
                        Nombre maximum de conteneurs par reservation
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="reminderHoursBefore">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Rappels (heures avant)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="24, 2"
                      />
                      <FieldDescription>
                        Heures avant le creneau pour envoyer des rappels (separees par des virgules)
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </div>

            <div className="flex justify-end pt-4">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? <Spinner className="mr-2 size-4" /> : <SaveIcon className="mr-2 size-4" />}
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </CardContent>
        </Card>
      </form>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Derniere mise a jour : {new Date(config.updatedAt).toLocaleString("fr-FR")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
