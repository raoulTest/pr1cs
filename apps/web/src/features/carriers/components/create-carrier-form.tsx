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

import { createCarrierSchema } from "../schemas";

interface CreateCarrierFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCarrierForm({ onSuccess, onCancel }: CreateCarrierFormProps) {
  const createCarrier = useMutation(api.carriers.mutations.create);

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
      taxId: "",
      address: "",
      phone: "",
      email: "",
      preferredLanguage: "en" as const,
      notificationChannel: "both" as const,
    },
    validators: {
      onSubmit: createCarrierSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createCarrier({
          name: value.name,
          code: value.code,
          taxId: value.taxId || undefined,
          address: value.address || undefined,
          phone: value.phone || undefined,
          email: value.email || undefined,
          preferredLanguage: value.preferredLanguage,
          notificationChannel: value.notificationChannel,
        });
        toast.success("Carrier company created successfully");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create carrier";
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
              <FieldLabel htmlFor={field.name}>Company Name *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Acme Transport Inc."
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Company Code *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="ACME-001"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="taxId">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Tax ID</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="123-456-789"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  type="tel"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="+1 (555) 123-4567"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="email">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="contact@acmetransport.com"
              />
              <FieldError errors={field.state.meta.errors} />
            </FieldContent>
          </Field>
        )}
      </form.Field>

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
                placeholder="123 Main St, City, State 12345"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="preferredLanguage">
          {(field) => (
            <Field>
              <FieldLabel>Preferred Language *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as "en" | "fr")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="notificationChannel">
          {(field) => (
            <Field>
              <FieldLabel>Notification Channel *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "in_app" | "email" | "both")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </div>

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
              {isSubmitting ? "Creating..." : "Create Carrier"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
