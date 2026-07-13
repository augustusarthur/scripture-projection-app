import { NextResponse } from "next/server";
import { fetchScripture } from "@/lib/scripture";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("ref")?.trim();
  const translation = searchParams.get("translation")?.trim() || "kjv";

  if (!reference) {
    return NextResponse.json(
      { error: "Missing ref query parameter" },
      { status: 400 },
    );
  }

  try {
    const passage = await fetchScripture(reference, translation);
    return NextResponse.json(passage);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
