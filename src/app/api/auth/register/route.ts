import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName, churchId } = parsed.data;

    const existing = await db.pastor.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const church = await db.church.findUnique({ where: { id: churchId } });
    if (!church) {
      return NextResponse.json(
        { error: "Selected church not found" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const pastor = await db.pastor.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        churchId,
      },
      include: { church: true },
    });

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
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    );
  }
}
