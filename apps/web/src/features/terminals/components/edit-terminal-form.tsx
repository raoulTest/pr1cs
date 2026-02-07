import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

import { updateTerminalSchema, COMMON_TIMEZONES } from "../schemas";

interface EditTerminalFormProps {
  terminalId: Id<"terminals">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditTerminalForm({
  terminalId,
  onSuccess,
  onCancel,
}: EditTerminalFormProps) {
  const terminal = useQuery(api.terminals.queries.get, { terminalId });
  const updateTerminal = useMutation(api.terminals.mutations.update);

  const form = useForm({
    defaultValues: {
      name: terminal?.name ?? "",
      address: terminal?.address ?? "",
      timezone: terminal?.timezone ?? "America/New_York",
      autoValidationThreshold: terminal?.autoValidationThreshold ?? 50,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const result = updateTerminalSchema.safeParse(value);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? "Validation échouée");
        return;
      }

      try {
        await updateTerminal({
          terminalId,
          name: value.name,
          address: value.address || undefined,
          timezone: value.timezone,
          autoValidationThreshold: value.autoValidationThreshold,
        });
        toast.success("Terminal mis à jour avec succès");
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Échec de la mise à jour";
        toast.error(message);
      }
    },
  });

  // Reset form when terminal data loads
  if (terminal && form.state.values.name === "" && terminal.name !== "") {
    form.reset({
      name: terminal.name,
      address: terminal.address ?? "",
      timezone: terminal.timezone,
      autoValidationThreshold: terminal.autoValidationThreshold ?? 50,
    });
  }

  if (terminal === undefined) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (terminal === null) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Terminal introuvable
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
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Nom du terminal *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Terminal Principal"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <Field>
          <FieldLabel>Code du terminal</FieldLabel>
          <FieldContent>
            <Input value={terminal.code} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              Le code ne peut pas être modifié
            </p>
          </FieldContent>
        </Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Adresse</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="123 Avenue du Port, Ville Portuaire, 12345"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="timezone">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Fuseau horaire *</FieldLabel>
            <FieldContent>
              <Select
                value={field.state.value}
                onValueChange={(value: string) => field.handleChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un fuseau horaire" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="autoValidationThreshold">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              Seuil de validation automatique (%)
            </FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                type="number"
                min={0}
                max={100}
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Les réservations sont auto-validées si la capacité est en
                dessous de ce seuil
              </p>
            </FieldContent>
          </Field>
        )}
      </form.Field>

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
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
