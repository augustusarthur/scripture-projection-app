import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await db.singleProfile.findMany({
    where: { churchId: session.churchId },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const profile = await db.singleProfile.create({
      data: {
        churchId: session.churchId,
        createdById: session.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        height: data.height || null,
        city: data.city || null,
        state: data.state || null,
        phone: data.phone || null,
        email: data.email || null,
        occupation: data.occupation || null,
        education: data.education || null,
        bio: data.bio || null,
        faithBackground: data.faithBackground || null,
        interests: data.interests || null,
        lookingFor: data.lookingFor || null,
        languages: data.languages || null,
        status: data.status,
        pastorNotes: data.pastorNotes || null,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}
