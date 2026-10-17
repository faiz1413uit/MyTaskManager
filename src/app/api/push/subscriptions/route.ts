import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getVapidConfig } from "@/lib/push/config";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

const deleteSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getVapidConfig();
  const subscriptionCount = await db.pushSubscription.count({
    where: { userId: BigInt(user.id) },
  });

  return NextResponse.json({
    configured: Boolean(config),
    publicKey: config?.publicKey ?? null,
    subscribed: subscriptionCount > 0,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = subscriptionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const userId = BigInt(user.id);

  await db.$transaction([
    db.pushSubscription.upsert({
      where: { endpoint: result.data.endpoint },
      create: {
        userId,
        endpoint: result.data.endpoint,
        p256dh: result.data.keys.p256dh,
        auth: result.data.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
      update: {
        userId,
        p256dh: result.data.keys.p256dh,
        auth: result.data.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { pushNotifications: true },
    }),
  ]);

  return NextResponse.json({ subscribed: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = deleteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const userId = BigInt(user.id);
  await db.pushSubscription.deleteMany({
    where: { userId, endpoint: result.data.endpoint },
  });
  const remaining = await db.pushSubscription.count({ where: { userId } });

  if (remaining === 0) {
    await db.user.update({
      where: { id: userId },
      data: { pushNotifications: false },
    });
  }

  return NextResponse.json({ subscribed: remaining > 0 });
}
