import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { getDayRange } from "@/lib/date";
import { db } from "@/lib/db";
import { serializeTask } from "@/lib/tasks/serialize";
import { createTaskSchema } from "@/lib/tasks/validation";

const priorities = new Set(["LOW", "MEDIUM", "HIGH"]);

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "all";
  const search = searchParams.get("search")?.trim();
  const priority = searchParams.get("priority");
  const sort = searchParams.get("sort") ?? "due";
  const today = getDayRange(user.timezone);

  const where: Prisma.TaskWhereInput = {
    userId: BigInt(user.id),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(priority && priorities.has(priority)
      ? { priority: priority as "LOW" | "MEDIUM" | "HIGH" }
      : {}),
  };

  if (view === "today") {
    where.status = "PENDING";
    where.dueAt = { lt: today.end };
  } else if (view === "upcoming") {
    where.status = "PENDING";
    where.dueAt = { gte: today.end };
  } else if (view === "completed") {
    where.status = "COMPLETED";
  } else {
    const status = searchParams.get("status");
    if (status === "PENDING" || status === "COMPLETED") {
      where.status = status;
    }
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    sort === "priority"
      ? [{ priority: "desc" }, { dueAt: "asc" }]
      : sort === "created"
        ? [{ createdAt: "desc" }]
        : [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];

  const tasks = await db.task.findMany({
    where,
    orderBy,
    take: 100,
  });

  return NextResponse.json({
    tasks: tasks.map(serializeTask),
    timezone: user.timezone,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = createTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Please correct the task details.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const task = await db.task.create({
    data: {
      userId: BigInt(user.id),
      title: result.data.title,
      description: result.data.description || null,
      priority: result.data.priority,
      dueAt: result.data.dueAt,
      reminderAt: result.data.reminderAt,
      isNotificationEnabled: Boolean(result.data.reminderAt),
    },
  });

  return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
}
