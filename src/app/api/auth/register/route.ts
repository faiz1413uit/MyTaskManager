import { hash } from "@node-rs/argon2";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const passwordHash = await hash(result.data.password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });

  try {
    const user = await db.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    await createSession(user.id);

    return NextResponse.json(
      { user: { ...user, id: user.id.toString() } },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Unable to create an account with those details." },
        { status: 409 },
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Account creation failed. Please try again." },
      { status: 500 },
    );
  }
}
