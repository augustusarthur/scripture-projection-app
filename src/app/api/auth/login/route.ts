import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const pastor = await db.pastor.findUnique({
      where: { email },
      include: { church: true },
    });

    if (!pastor || !(await verifyPassword(password, pastor.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSession({
      id: pastor.id,
      email: pastor.email,
      firstName: pastor.firstName,
      lastName: pastor.lastName,
      churchId: pastor.churchId,
      churchName: pastor.church.name,
    });

    return NextResponse.json({
      pastor: {
        id: pastor.id,
        email: pastor.email,
        firstName: pastor.firstName,
        lastName: pastor.lastName,
        churchId: pastor.churchId,
        churchName: pastor.church.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
