export type ScriptureVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

export type ScripturePassage = {
  reference: string;
  text: string;
  verses: ScriptureVerse[];
  translation_name: string;
};

function normalizeReference(input: string) {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/chapter/gi, "")
    .replace(/verse/gi, "")
    .replace(/verses/gi, "")
    .replace(/:/g, " ")
    .replace(/(\d+)\s+(\d+)/g, "$1:$2")
    .replace(/\s*-\s*/g, "-");
}

export function parseSpokenReference(transcript: string) {
  let ref = transcript.trim();

  const bookAliases: Record<string, string> = {
    "first john": "1 john",
    "second john": "2 john",
    "third john": "3 john",
    "first peter": "1 peter",
    "second peter": "2 peter",
    "first corinthians": "1 corinthians",
    "second corinthians": "2 corinthians",
    "first thessalonians": "1 thessalonians",
    "second thessalonians": "2 thessalonians",
    "first timothy": "1 timothy",
    "second timothy": "2 timothy",
    "psalm": "psalms",
  };

  const lower = ref.toLowerCase();
  for (const [spoken, canonical] of Object.entries(bookAliases)) {
    if (lower.startsWith(spoken)) {
      ref = canonical + ref.slice(spoken.length);
      break;
    }
  }

  return normalizeReference(ref);
}

export async function fetchScripture(reference: string): Promise<ScripturePassage> {
  const normalized = parseSpokenReference(reference);
  if (!normalized) {
    throw new Error("Enter a scripture reference like John 3:16");
  }

  const url = `https://bible-api.com/${encodeURIComponent(normalized)}?translation=kjv`;
  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error("Could not find that scripture reference");
  }

  const data = await response.json();

  if (!data?.verses?.length) {
    throw new Error("Could not find that scripture reference");
  }

  return {
    reference: data.reference,
    text: data.text,
    verses: data.verses,
    translation_name: data.translation_name || "KJV",
  };
}

export const SCRIPTURE_CHANNEL = "shepherd-scripture-display";
