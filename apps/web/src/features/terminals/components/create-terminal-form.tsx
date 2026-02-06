import { api } from "@microhack/backend/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
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

import { createTerminalSchema, COMMON_TIMEZONES } from "../schemas";

interface CreateTerminalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateTerminalForm({ onSuccess, onCancel }: CreateTerminalFormProps) {
  const createTerminal = useMutation(api.terminals.mutations.create);

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
      address: "",
      timezone: "America/New_York",
    },
    validators: {
      onSubmit: createTerminalSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createTerminal({
          name: value.name,
          code: value.code,
          address: value.address || undefined,
          timezone: value.timezone,
        });
        toast.success("Terminal created successfully");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create terminal";
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
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Terminal Name *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Main Terminal"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Terminal Code *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="TRM-001"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Address</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="123 Port Drive, Harbor City, ST 12345"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="timezone">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Timezone *</FieldLabel>
            <FieldContent>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
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
              {isSubmitting ? "Creating..." : "Create Terminal"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
