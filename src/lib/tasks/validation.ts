import { z } from "zod";

const optionalDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(""), z.null()])
  .transform((value) => (value ? new Date(value) : null));

const taskFields = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueAt: optionalDateTime.optional(),
  reminderAt: optionalDateTime.optional(),
});

export const createTaskSchema = taskFields;

export const updateTaskSchema = taskFields.partial().extend({
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
});
