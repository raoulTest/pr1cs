import { z } from "zod";

export const createCarrierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must be uppercase letters, numbers, or hyphens",
    ),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  preferredLanguage: z.enum(["en", "fr"]),
  notificationChannel: z.enum(["in_app", "email", "both"]),
});

export type CreateCarrierFormValues = z.infer<typeof createCarrierSchema>;
