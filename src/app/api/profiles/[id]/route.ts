import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { uploadProfilePhoto } from "@/lib/photos";

export const runtime = "nodejs";

async function canAccessProfile(
  profileId: string,
  pastorId: string,
  churchId: string,
) {
  const profile = await db.singleProfile.findUnique({
    where: { id: profileId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      church: { select: { id: true, name: true, city: true, state: true } },
      shares: {
        where: { sharedWithId: pastorId },
        include: {
          sharedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!profile) return null;

  const isOwner = profile.churchId === churchId;
  const isShared = profile.shares.length > 0;

  if (!isOwner && !isShared) return null;

  return { profile, isOwner };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await canAccessProfile(id, session.id, session.churchId);

  if (!access) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: access.profile,
    isOwner: access.isOwner,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await canAccessProfile(id, session.id, session.churchId);

  if (!access) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!access.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const profile = await db.singleProfile.update({
      where: { id },
      data: {
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

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await canAccessProfile(id, session.id, session.churchId);

  if (!access) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!access.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.singleProfile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await canAccessProfile(id, session.id, session.churchId);

  if (!access) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!access.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const photoUrl = await uploadProfilePhoto(id, file);
    const profile = await db.singleProfile.update({
      where: { id },
      data: { photoUrl },
    });

    return NextResponse.json({ profile, photoUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
