import type { Task } from "@/generated/prisma/client";

export type TaskDto = {
  id: number;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  dueAt: string | null;
  reminderAt: string | null;
  isNotificationEnabled: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeTask(task: Task): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueAt: task.dueAt?.toISOString() ?? null,
    reminderAt: task.reminderAt?.toISOString() ?? null,
    isNotificationEnabled: task.isNotificationEnabled,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
