import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { shareSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await db.profileShare.findMany({
    where: { sharedWithId: session.id },
    include: {
      profile: {
        include: {
          church: { select: { id: true, name: true, city: true, state: true } },
        },
      },
      sharedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          church: { select: { name: true, city: true, state: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ shares });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = shareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { profileId, sharedWithId, message } = parsed.data;

    if (sharedWithId === session.id) {
      return NextResponse.json(
        { error: "You cannot share a profile with yourself" },
        { status: 400 },
      );
    }

    const profile = await db.singleProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile || profile.createdById !== session.id) {
      return NextResponse.json(
        { error: "Profile not found or not owned by you" },
        { status: 404 },
      );
    }

    const recipient = await db.pastor.findUnique({
      where: { id: sharedWithId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient pastor not found" },
        { status: 404 },
      );
    }

    const existing = await db.profileShare.findUnique({
      where: {
        profileId_sharedWithId: { profileId, sharedWithId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This profile has already been shared with that pastor" },
        { status: 409 },
      );
    }

    const share = await db.profileShare.create({
      data: {
        profileId,
        sharedById: session.id,
        sharedWithId,
        message: message || null,
      },
      include: {
        sharedWith: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to share profile" },
      { status: 500 },
    );
  }
}
