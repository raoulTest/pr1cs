import { z } from "zod";

const truckTypeSchema = z.enum([
  "container",
  "flatbed",
  "tanker",
  "refrigerated",
  "bulk",
  "general",
]);

const truckClassSchema = z.enum(["light", "medium", "heavy", "super_heavy"]);

export const createTruckSchema = z.object({
  carrierCompanyId: z.string().min(1, "Carrier company is required"),
  licensePlate: z
    .string()
    .min(2, "License plate must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "License plate must be uppercase letters, numbers, or hyphens"),
  truckType: truckTypeSchema,
  truckClass: truckClassSchema,
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  maxWeight: z.number().min(0).optional(),
});

export type CreateTruckFormValues = z.infer<typeof createTruckSchema>;

export const TRUCK_TYPES = [
  { value: "container", label: "Container" },
  { value: "flatbed", label: "Flatbed" },
  { value: "tanker", label: "Tanker" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "bulk", label: "Bulk" },
  { value: "general", label: "General" },
] as const;

export const TRUCK_CLASSES = [
  { value: "light", label: "Light (< 3.5t)" },
  { value: "medium", label: "Medium (3.5t - 7.5t)" },
  { value: "heavy", label: "Heavy (7.5t - 18t)" },
  { value: "super_heavy", label: "Super Heavy (> 18t)" },
] as const;
