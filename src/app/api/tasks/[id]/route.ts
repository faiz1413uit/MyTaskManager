import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cancelPendingReminders } from "@/lib/tasks/reminders";
import { serializeTask } from "@/lib/tasks/serialize";
import { updateTaskSchema } from "@/lib/tasks/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedTaskId(context: RouteContext, userId: bigint) {
  const id = Number((await context.params).id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return db.task.findFirst({
    where: { id, userId },
    select: { id: true, reminderAt: true },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedTask = await getOwnedTaskId(context, BigInt(user.id));
  if (!ownedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = await db.task.findUniqueOrThrow({ where: { id: ownedTask.id } });
  return NextResponse.json({ task: serializeTask(task) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedTask = await getOwnedTaskId(context, BigInt(user.id));
  if (!ownedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const result = updateTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Please correct the task details.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data: Prisma.TaskUpdateInput = {
    ...result.data,
    description:
      result.data.description === undefined
        ? undefined
        : result.data.description || null,
  };

  if (result.data.status === "COMPLETED") {
    data.completedAt = new Date();
    data.isNotificationEnabled = false;
  } else if (result.data.status === "PENDING") {
    data.completedAt = null;
    data.isNotificationEnabled = Boolean(
      result.data.reminderAt ?? ownedTask.reminderAt,
    );
  }

  if (result.data.reminderAt !== undefined) {
    data.reminderSentAt = null;
    data.isNotificationEnabled =
      result.data.status !== "COMPLETED" && Boolean(result.data.reminderAt);
  }

  const reminderRemoved = result.data.reminderAt === null;
  const reminderChanged =
    result.data.reminderAt instanceof Date &&
    ownedTask.reminderAt?.getTime() !== result.data.reminderAt.getTime();

  if (
    result.data.status === "COMPLETED" ||
    reminderRemoved ||
    reminderChanged
  ) {
    await cancelPendingReminders(ownedTask.id);
  }

  const task = await db.task.update({
    where: { id: ownedTask.id },
    data,
  });

  return NextResponse.json({ task: serializeTask(task) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedTask = await getOwnedTaskId(context, BigInt(user.id));
  if (!ownedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.task.delete({ where: { id: ownedTask.id } });
  return new NextResponse(null, { status: 204 });
}
