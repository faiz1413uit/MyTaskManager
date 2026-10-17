import { z } from "zod";
import { isValidTimeZone } from "@/lib/date";

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    timezone: z
      .string()
      .trim()
      .max(64)
      .refine(isValidTimeZone, "Choose a valid time zone"),
    theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
    inAppNotifications: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No settings provided.",
  });
