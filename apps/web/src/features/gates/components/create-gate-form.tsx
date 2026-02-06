import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";

import { createGateSchema, TRUCK_TYPES, TRUCK_CLASSES } from "../schemas";

interface CreateGateFormProps {
  terminalId?: Id<"terminals">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateGateForm({ terminalId, onSuccess, onCancel }: CreateGateFormProps) {
  const createGate = useMutation(api.gates.mutations.create);
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });

  const form = useForm({
    defaultValues: {
      terminalId: terminalId ?? "",
      name: "",
      code: "",
      description: "",
      defaultCapacity: 10,
      allowedTruckTypes: [] as string[],
      allowedTruckClasses: [] as string[],
    },
    validators: {
      onSubmit: createGateSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createGate({
          terminalId: value.terminalId as Id<"terminals">,
          name: value.name,
          code: value.code,
          description: value.description || undefined,
          defaultCapacity: value.defaultCapacity,
          allowedTruckTypes: value.allowedTruckTypes as (
            | "container"
            | "flatbed"
            | "tanker"
            | "refrigerated"
            | "bulk"
            | "general"
          )[],
          allowedTruckClasses: value.allowedTruckClasses as (
            | "light"
            | "medium"
            | "heavy"
            | "super_heavy"
          )[],
        });
        toast.success("Gate created successfully");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create gate";
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
      <form.Field name="terminalId">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Terminal *</FieldLabel>
            <FieldContent>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={!!terminalId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a terminal" />
                </SelectTrigger>
                <SelectContent>
                  {terminals?.map((terminal) => (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Gate Name *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Gate A"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Gate Code *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="GATE-A1"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Main container gate for large trucks"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="defaultCapacity">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Default Capacity *</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                type="number"
                min={1}
                value={field.state.value}
                onChange={(e) => field.handleChange(parseInt(e.target.value) || 1)}
                onBlur={field.handleBlur}
              />
              <FieldDescription>
                Maximum trucks per time slot (can be overridden per slot)
              </FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="allowedTruckTypes">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Allowed Truck Types *</FieldLabel>
            <FieldContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TRUCK_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`truck-type-${type.value}`}
                      checked={field.state.value.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.handleChange([...field.state.value, type.value]);
                        } else {
                          field.handleChange(
                            field.state.value.filter((t) => t !== type.value)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`truck-type-${type.value}`} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="allowedTruckClasses">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Allowed Truck Classes *</FieldLabel>
            <FieldContent>
              <div className="grid grid-cols-2 gap-2">
                {TRUCK_CLASSES.map((cls) => (
                  <div key={cls.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`truck-class-${cls.value}`}
                      checked={field.state.value.includes(cls.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.handleChange([...field.state.value, cls.value]);
                        } else {
                          field.handleChange(
                            field.state.value.filter((c) => c !== cls.value)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`truck-class-${cls.value}`} className="text-sm">
                      {cls.label}
                    </Label>
                  </div>
                ))}
              </div>
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
              {isSubmitting ? "Creating..." : "Create Gate"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
