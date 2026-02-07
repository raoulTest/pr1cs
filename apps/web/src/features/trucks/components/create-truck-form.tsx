import { api } from "@microhack/backend/convex/_generated/api";
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

import { createTruckSchema, TRUCK_TYPES, TRUCK_CLASSES } from "../schemas";

interface CreateTruckFormProps {
  /** Pre-selected carrier ownerId (for admin creating trucks for a carrier) */
  ownerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateTruckForm({ ownerId, onSuccess, onCancel }: CreateTruckFormProps) {
  const createTruck = useMutation(api.trucks.mutations.create);
  
  // Only fetch carriers if we're in admin mode (no pre-selected ownerId)
  const carriers = useQuery(
    api.carriers.queries.listCarriers,
    !ownerId ? { limit: 100 } : "skip"
  );

  const form = useForm({
    defaultValues: {
      ownerId: ownerId ?? "",
      licensePlate: "",
      truckType: "" as "container" | "flatbed" | "tanker" | "refrigerated" | "bulk" | "general",
      truckClass: "" as "light" | "medium" | "heavy" | "super_heavy",
      make: "",
      model: "",
      year: undefined as number | undefined,
      maxWeight: undefined as number | undefined,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod first
      const result = createTruckSchema.safeParse(value);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        toast.error(firstError ?? "Validation failed");
        return;
      }
      
      try {
        await createTruck({
          ownerId: value.ownerId || undefined, // Backend defaults to current user if not provided
          licensePlate: value.licensePlate,
          truckType: value.truckType,
          truckClass: value.truckClass,
          make: value.make || undefined,
          model: value.model || undefined,
          year: value.year,
          maxWeight: value.maxWeight,
        });
        toast.success("Camion créé avec succès");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Échec de la création du camion";
        toast.error(message);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Only show carrier selection for admins */}
      {!ownerId && carriers !== undefined && (
        <form.Field name="ownerId">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel>Transporteur *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) => field.handleChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.userId} value={carrier.userId}>
                        {carrier.userId} ({carrier.truckCount} camions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      )}

      <form.Field name="licensePlate">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Plaque d'immatriculation *</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                onBlur={field.handleBlur}
                placeholder="ABC-1234"
              />
              <FieldDescription>
                Lettres majuscules, chiffres ou tirets uniquement
              </FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="truckType">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel>Type de camion *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) => field.handleChange(value as typeof field.state.value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="truckClass">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel>Classe de camion *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) => field.handleChange(value as typeof field.state.value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner la classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_CLASSES.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="make">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Marque</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="ex: Volvo, Scania"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="model">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Modèle</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="ex: FH16, R500"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="year">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Année</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.handleChange(val ? parseInt(val) : undefined);
                  }}
                  onBlur={field.handleBlur}
                  placeholder="ex: 2023"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="maxWeight">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Poids max (kg)</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.handleChange(val ? parseFloat(val) : undefined);
                  }}
                  onBlur={field.handleBlur}
                  placeholder="ex: 18000"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
              {isSubmitting ? "Création..." : "Créer le camion"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
