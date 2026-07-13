import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const churches = await db.church.findMany({
    orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ churches });
}
