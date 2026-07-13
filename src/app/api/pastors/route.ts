import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const pastors = await db.pastor.findMany({
    where: {
      id: { not: session.id },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { church: { name: { contains: q } } },
              { church: { city: { contains: q } } },
              { church: { state: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      church: { select: { id: true, name: true, city: true, state: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 50,
  });

  return NextResponse.json({ pastors });
}
