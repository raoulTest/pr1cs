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

export const createGateSchema = z.object({
  terminalId: z.string().min(1, "Terminal is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, or hyphens"),
  description: z.string().optional(),
  // Note: defaultCapacity was removed - capacity is now at terminal level
  allowedTruckTypes: z.array(truckTypeSchema).min(1, "Select at least one truck type"),
  allowedTruckClasses: z.array(truckClassSchema).min(1, "Select at least one truck class"),
});

export type CreateGateFormValues = z.infer<typeof createGateSchema>;

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
