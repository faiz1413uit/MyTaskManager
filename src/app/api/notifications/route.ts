import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().regex(/^\d+$/) }),
]);

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = BigInt(user.id);
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        taskId: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((notification) => ({
      ...notification,
      id: notification.id.toString(),
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = markReadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
  }

  const userId = BigInt(user.id);
  await db.notification.updateMany({
    where:
      "all" in result.data
        ? { userId, readAt: null }
        : { id: BigInt(result.data.id), userId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
