import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { updateSettingsSchema } from "@/lib/settings/validation";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = updateSettingsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Please correct the settings.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const updated = await db.user.update({
    where: { id: BigInt(user.id) },
    data: result.data,
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      theme: true,
      inAppNotifications: true,
      pushNotifications: true,
    },
  });

  return NextResponse.json({
    user: {
      ...updated,
      id: updated.id.toString(),
    },
  });
}
