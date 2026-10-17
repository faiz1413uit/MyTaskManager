import { hash, verify } from "@node-rs/argon2";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

const invalidCredentials = () =>
  NextResponse.json(
    { error: "The email or password is incorrect." },
    { status: 401 },
  );

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return invalidCredentials();
  }

  const user = await db.user.findUnique({
    where: { email: result.data.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  const passwordHash =
    user?.passwordHash ??
    (await hash("invalid-password", {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    }));
  const passwordMatches = await verify(passwordHash, result.data.password);

  if (!user || !user.isActive || !passwordMatches) {
    return invalidCredentials();
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
    },
  });
}
