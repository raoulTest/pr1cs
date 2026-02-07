import { z } from "zod";

export const createTerminalSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  code: z
    .string()
    .min(2, "Le code doit avoir au moins 2 caractères")
    .regex(/^[A-Z0-9-]+$/, "Le code doit contenir uniquement des lettres majuscules, chiffres ou tirets"),
  address: z.string().optional(),
  timezone: z.string().min(1, "Le fuseau horaire est requis"),
});

export type CreateTerminalFormValues = z.infer<typeof createTerminalSchema>;

export const updateTerminalSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  address: z.string().optional(),
  timezone: z.string().min(1, "Le fuseau horaire est requis"),
  autoValidationThreshold: z.number().min(0).max(100).optional(),
});

export type UpdateTerminalFormValues = z.infer<typeof updateTerminalSchema>;

// Common timezones for port operations
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
] as const;
