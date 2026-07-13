export const CHANNEL_NAME = "scripture-projection";

export const TRANSLATION_OPTIONS = [
  { code: "kjv", label: "KJV" },
  { code: "web", label: "WEB" },
  { code: "asv", label: "ASV" },
  { code: "ylt", label: "YLT" },
  { code: "darby", label: "Darby" },
  { code: "dra", label: "DRA" },
] as const;

export type TranslationCode = (typeof TRANSLATION_OPTIONS)[number]["code"];

export const BOOK_UI = [
  { label: "Genesis", api: "genesis" },
  { label: "Exodus", api: "exodus" },
  { label: "Leviticus", api: "leviticus" },
  { label: "Numbers", api: "numbers" },
  { label: "Deuteronomy", api: "deuteronomy" },
  { label: "Joshua", api: "joshua" },
  { label: "Judges", api: "judges" },
  { label: "Ruth", api: "ruth" },
  { label: "1 Samuel", api: "1 samuel" },
  { label: "2 Samuel", api: "2 samuel" },
  { label: "1 Kings", api: "1 kings" },
  { label: "2 Kings", api: "2 kings" },
  { label: "1 Chronicles", api: "1 chronicles" },
  { label: "2 Chronicles", api: "2 chronicles" },
  { label: "Ezra", api: "ezra" },
  { label: "Nehemiah", api: "nehemiah" },
  { label: "Esther", api: "esther" },
  { label: "Job", api: "job" },
  { label: "Psalms", api: "psalm" },
  { label: "Proverbs", api: "proverbs" },
  { label: "Ecclesiastes", api: "ecclesiastes" },
  { label: "Song of Solomon", api: "song of solomon" },
  { label: "Isaiah", api: "isaiah" },
  { label: "Jeremiah", api: "jeremiah" },
  { label: "Lamentations", api: "lamentations" },
  { label: "Ezekiel", api: "ezekiel" },
  { label: "Daniel", api: "daniel" },
  { label: "Hosea", api: "hosea" },
  { label: "Joel", api: "joel" },
  { label: "Amos", api: "amos" },
  { label: "Obadiah", api: "obadiah" },
  { label: "Jonah", api: "jonah" },
  { label: "Micah", api: "micah" },
  { label: "Nahum", api: "nahum" },
  { label: "Habakkuk", api: "habakkuk" },
  { label: "Zephaniah", api: "zephaniah" },
  { label: "Haggai", api: "haggai" },
  { label: "Zechariah", api: "zechariah" },
  { label: "Malachi", api: "malachi" },
  { label: "Matthew", api: "matthew" },
  { label: "Mark", api: "mark" },
  { label: "Luke", api: "luke" },
  { label: "John", api: "john" },
  { label: "Acts", api: "acts" },
  { label: "Romans", api: "romans" },
  { label: "1 Corinthians", api: "1 corinthians" },
  { label: "2 Corinthians", api: "2 corinthians" },
  { label: "Galatians", api: "galatians" },
  { label: "Ephesians", api: "ephesians" },
  { label: "Philippians", api: "philippians" },
  { label: "Colossians", api: "colossians" },
  { label: "1 Thessalonians", api: "1 thessalonians" },
  { label: "2 Thessalonians", api: "2 thessalonians" },
  { label: "1 Timothy", api: "1 timothy" },
  { label: "2 Timothy", api: "2 timothy" },
  { label: "Titus", api: "titus" },
  { label: "Philemon", api: "philemon" },
  { label: "Hebrews", api: "hebrews" },
  { label: "James", api: "james" },
  { label: "1 Peter", api: "1 peter" },
  { label: "2 Peter", api: "2 peter" },
  { label: "1 John", api: "1 john" },
  { label: "2 John", api: "2 john" },
  { label: "3 John", api: "3 john" },
  { label: "Jude", api: "jude" },
  { label: "Revelation", api: "revelation" },
] as const;

export type ScriptureRefMode = "chapter" | "verse" | "range";

export type ScriptureRef = {
  mode: ScriptureRefMode;
  bookSlug: string;
  bookApi: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  label: string;
};

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

export const BACKGROUND_IMAGES = [
  "Paint_Sweeps_Blank-9174dadb-3203-4098-a5f6-a0bc55282982.png",
  "Paint_Sweeps_Burn-fcab9c33-9dff-441c-80e5-ddabce8a43f7.png",
  "Paint_Sweeps_Dreams-1fe90cb2-1f54-4197-bbc5-0cbfb0e9f46e.png",
  "Paint_Sweeps_Evergreen-17e89563-5db8-4a36-b8ed-a51727a1417f.png",
  "Paint_Sweeps_Field-84bafcda-ac58-4a07-a29b-782c1df77c0e.png",
  "Paint_Sweeps_Final-97c74dbc-74e9-4399-9e12-e65c7228581c.png",
  "Paint_Sweeps_Forest-e428237b-8aa6-4561-913f-fbfae154aedb.png",
  "Paint_Sweeps_Forever-7bb94e7a-4ad9-461d-b96e-0af371f641e7.png",
  "Paint_Sweeps_Fun-71f311c6-e48f-4083-be11-7dcb6eaaacc4.png",
  "Paint_Sweeps_Gold-6ed028a5-b5e0-4c54-85d6-1b0a766a7f52.png",
  "Paint_Sweeps_Hope-88f20f4f-59ff-430b-a177-07219008c4fc.png",
  "Paint_Sweeps_Joy-a9338083-9580-4696-bafe-348fe488b648.png",
  "Paint_Sweeps_King-ecdd8ad3-bdcd-491d-9e54-6ce1ec47daa0.png",
  "Paint_Sweeps_Love-d4b98107-b037-4e19-815c-6ebda913ad08.png",
  "Paint_Sweeps_Peace-7c529f9b-702a-4fa7-a7e6-1cd5f096e411.png",
  "Paint_Sweeps_Shine-100fc05e-6c42-4c32-b443-4d851a9d8530.png",
  "Paint_Sweeps_Silver-83881640-29aa-472b-949d-7f294362ea37.png",
  "Paint_Sweeps_Spread-1b7c98cf-dfa9-46f6-9937-feddeca9181e.png",
  "Paint_Sweeps_Strong-ae973bb2-d92d-4d39-8db8-e5ee3d7639e8.png",
  "Paint_Sweeps_Torn-5d30ef62-9b16-4c59-94fd-7c30ddbea6a8.png",
  "Paint_Sweeps_Vive-c2bf87f2-c333-47a4-b989-e3dddd3ec379.png",
];

export function backgroundUrlFromFile(fileName: string) {
  if (!fileName) return "";
  return `/scripture/backgrounds/${fileName}`;
}

const ONE_WORD_BOOKS = [
  { api: "genesis", slug: "Genesis", aliases: ["genesis", "gen"] },
  { api: "exodus", slug: "Exodus", aliases: ["exodus", "exod"] },
  { api: "leviticus", slug: "Leviticus", aliases: ["leviticus", "lev"] },
  { api: "numbers", slug: "Numbers", aliases: ["numbers", "num"] },
  { api: "deuteronomy", slug: "Deuteronomy", aliases: ["deuteronomy", "deut"] },
  { api: "joshua", slug: "Joshua", aliases: ["joshua", "josh"] },
  { api: "judges", slug: "Judges", aliases: ["judges", "judge", "judg"] },
  { api: "ruth", slug: "Ruth", aliases: ["ruth"] },
  { api: "ezra", slug: "Ezra", aliases: ["ezra"] },
  { api: "nehemiah", slug: "Nehemiah", aliases: ["nehemiah", "neh"] },
  { api: "esther", slug: "Esther", aliases: ["esther", "est"] },
  { api: "job", slug: "Job", aliases: ["job"] },
  { api: "psalm", slug: "Psalms", aliases: ["psalm", "psalms", "ps"] },
  { api: "proverbs", slug: "Proverbs", aliases: ["proverbs", "prov"] },
  { api: "ecclesiastes", slug: "Ecclesiastes", aliases: ["ecclesiastes", "ecc"] },
  { api: "isaiah", slug: "Isaiah", aliases: ["isaiah", "isa"] },
  { api: "jeremiah", slug: "Jeremiah", aliases: ["jeremiah", "jer"] },
  { api: "lamentations", slug: "Lamentations", aliases: ["lamentations", "lam"] },
  { api: "ezekiel", slug: "Ezekiel", aliases: ["ezekiel", "ezek"] },
  { api: "daniel", slug: "Daniel", aliases: ["daniel", "dan"] },
  { api: "hosea", slug: "Hosea", aliases: ["hosea", "hos"] },
  { api: "joel", slug: "Joel", aliases: ["joel"] },
  { api: "amos", slug: "Amos", aliases: ["amos"] },
  { api: "obadiah", slug: "Obadiah", aliases: ["obadiah", "obad"] },
  { api: "jonah", slug: "Jonah", aliases: ["jonah"] },
  { api: "micah", slug: "Micah", aliases: ["micah", "mic"] },
  { api: "nahum", slug: "Nahum", aliases: ["nahum"] },
  { api: "habakkuk", slug: "Habakkuk", aliases: ["habakkuk", "hab"] },
  { api: "zephaniah", slug: "Zephaniah", aliases: ["zephaniah", "zep"] },
  { api: "haggai", slug: "Haggai", aliases: ["haggai"] },
  { api: "zechariah", slug: "Zechariah", aliases: ["zechariah", "zech"] },
  { api: "malachi", slug: "Malachi", aliases: ["malachi", "mal"] },
  { api: "matthew", slug: "Matthew", aliases: ["matthew", "matt"] },
  { api: "mark", slug: "Mark", aliases: ["mark", "mrk"] },
  { api: "luke", slug: "Luke", aliases: ["luke"] },
  { api: "john", slug: "John", aliases: ["john"] },
  { api: "acts", slug: "Acts", aliases: ["acts"] },
  { api: "romans", slug: "Romans", aliases: ["romans", "rom"] },
  { api: "galatians", slug: "Galatians", aliases: ["galatians", "gal"] },
  { api: "ephesians", slug: "Ephesians", aliases: ["ephesians", "eph"] },
  { api: "philippians", slug: "Philippians", aliases: ["philippians", "phil"] },
  { api: "colossians", slug: "Colossians", aliases: ["colossians", "col"] },
  { api: "titus", slug: "Titus", aliases: ["titus"] },
  { api: "philemon", slug: "Philemon", aliases: ["philemon", "philem"] },
  { api: "hebrews", slug: "Hebrews", aliases: ["hebrews", "heb"] },
  { api: "james", slug: "James", aliases: ["james", "jas"] },
  { api: "jude", slug: "Jude", aliases: ["jude"] },
  { api: "revelation", slug: "Revelation", aliases: ["revelation", "revelations", "rev"] },
];

const PREFIX_WORDS: Record<string, number> = {
  first: 1,
  "1": 1,
  i: 1,
  second: 2,
  "2": 2,
  ii: 2,
  third: 3,
  "3": 3,
  iii: 3,
};

const PREFIXED_BASE: Record<string, string> = {
  samuel: "samuel",
  kings: "kings",
  chronicles: "chronicles",
  corinthians: "corinthians",
  thessalonians: "thessalonians",
  timothy: "timothy",
  peter: "peter",
  john: "john",
};

const PREFIXED_BASE_DISPLAY: Record<string, string> = {
  samuel: "Samuel",
  kings: "Kings",
  chronicles: "Chronicles",
  corinthians: "Corinthians",
  thessalonians: "Thessalonians",
  timothy: "Timothy",
  peter: "Peter",
  john: "John",
};

const ONE_WORD_BOOK_ALIAS_TO_INFO = (() => {
  const map = new Map<string, { slug: string; api: string }>();
  for (const b of ONE_WORD_BOOKS) {
    for (const a of b.aliases) map.set(a, { slug: b.slug, api: b.api });
  }
  map.set("deut", { slug: "Deuteronomy", api: "deuteronomy" });
  map.set("jude", { slug: "Jude", api: "jude" });
  map.set("rev", { slug: "Revelation", api: "revelation" });
  map.set("revelation", { slug: "Revelation", api: "revelation" });
  map.set("revelations", { slug: "Revelation", api: "revelation" });
  return map;
})();

const WORD_NUM: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

function normalizeTranscript(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[.,?!;()[\]{}"]/g, " ")
    .replace(/:/g, " : ")
    .replace(/-/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumberTokens(tokens: string[], startIdx: number) {
  const t = tokens[startIdx];
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    return { value: parseInt(t, 10), next: startIdx + 1 };
  }
  if (!(t in WORD_NUM)) return null;

  let end = startIdx;
  let current = 0;
  let total = 0;
  let saw = false;

  while (end < tokens.length && end - startIdx < 4) {
    const w = tokens[end];
    if (w === "and") {
      end++;
      continue;
    }
    if (!(w in WORD_NUM)) break;
    saw = true;

    const v = WORD_NUM[w];
    if (v === 100) {
      total += Math.max(1, current) * 100;
      current = 0;
    } else if (v >= 20 && v % 10 === 0) {
      current += v;
    } else {
      current += v;
    }
    end++;
  }

  if (!saw) return null;
  const value = total + current;
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, next: end };
}

function findBookAt(tokens: string[], i: number) {
  if (tokens[i] === "song" && tokens[i + 1] === "of" && tokens[i + 2] === "solomon") {
    return { slug: "Song of Solomon", api: "song of solomon", len: 3 };
  }

  const single = ONE_WORD_BOOK_ALIAS_TO_INFO.get(tokens[i]);
  if (single) return { slug: single.slug, api: single.api, len: 1 };

  const prefix = PREFIX_WORDS[tokens[i]];
  if (prefix && PREFIXED_BASE[tokens[i + 1]]) {
    const base = PREFIXED_BASE[tokens[i + 1]];
    const slug = `${prefix} ${PREFIXED_BASE_DISPLAY[base] || base}`;
    const api = `${prefix} ${base}`;
    return { slug, api, len: 2 };
  }

  if (tokens[i] === "song" && tokens[i + 1] === "solomon") {
    return { slug: "Song of Solomon", api: "song of solomon", len: 2 };
  }

  return null;
}

export function formatReferenceLabel(ref: Omit<ScriptureRef, "label"> & { label?: string }) {
  if (ref.mode === "chapter") return `${ref.bookSlug} ${ref.chapter}`;
  if (ref.mode === "verse") return `${ref.bookSlug} ${ref.chapter}:${ref.verseStart}`;
  return `${ref.bookSlug} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
}

function extractReferenceAt(
  tokens: string[],
  i: number,
  book: { slug: string; api: string; len: number },
): ScriptureRef | null {
  let j = i + book.len;

  while (j < tokens.length && ["chapter", "chap", "verse", "verses", "the"].includes(tokens[j])) {
    j++;
  }

  const ch = parseNumberTokens(tokens, j);
  if (!ch) return null;
  j = ch.next;

  const FILLER = new Set([
    "show", "me", "us", "please", "read", "give", "then", "the", "in", "from", "to", "lets", "let's", "that",
  ]);

  while (j < tokens.length && FILLER.has(tokens[j])) j++;

  if (tokens[j] === "and" && (tokens[j + 1] === "verse" || tokens[j + 1] === "verses")) {
    j += 2;
    while (j < tokens.length && FILLER.has(tokens[j])) j++;
  } else if (tokens[j] === "and") {
    j += 1;
    while (j < tokens.length && FILLER.has(tokens[j])) j++;
  }

  if (tokens[j] === ":" || tokens[j] === ".") {
    j++;
  } else if (tokens[j] === "verse" || tokens[j] === "verses") {
    j++;
    while (j < tokens.length && FILLER.has(tokens[j])) j++;
  }

  const v1 = parseNumberTokens(tokens, j);
  if (!v1) {
    const ref: ScriptureRef = {
      mode: "chapter",
      bookSlug: book.slug,
      bookApi: book.api,
      chapter: ch.value,
      label: "",
    };
    ref.label = formatReferenceLabel(ref);
    return ref;
  }
  j = v1.next;

  const verseStart = v1.value;
  let mode: ScriptureRefMode = "verse";

  const t = tokens[j];
  if (t === "-" || t === "to" || t === "through" || t === "unto" || t === "and") {
    j++;
    const v2 = parseNumberTokens(tokens, j);
    let verseEnd: number | null = null;
    if (v2 && v2.value === ch.value) {
      const v3 = parseNumberTokens(tokens, v2.next);
      if (v3) verseEnd = v3.value;
    }
    if (verseEnd === null && v2) verseEnd = v2.value;

    if (verseEnd !== null) {
      const normalizedStart = Math.min(verseStart, verseEnd);
      const normalizedEnd = Math.max(verseStart, verseEnd);
      const ref: ScriptureRef = {
        mode: "range",
        bookSlug: book.slug,
        bookApi: book.api,
        chapter: ch.value,
        verseStart: normalizedStart,
        verseEnd: normalizedEnd,
        label: "",
      };
      ref.label = formatReferenceLabel(ref);
      return ref;
    }
  }

  const ref: ScriptureRef = {
    mode,
    bookSlug: book.slug,
    bookApi: book.api,
    chapter: ch.value,
    verseStart,
    label: "",
  };
  ref.label = formatReferenceLabel(ref);
  return ref;
}

export function extractLatestReference(transcript: string): ScriptureRef | null {
  const text = normalizeTranscript(transcript);
  if (!text) return null;
  const tokens = text.split(" ");

  const matches: ScriptureRef[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const book = findBookAt(tokens, i);
    if (!book) continue;
    const ref = extractReferenceAt(tokens, i, book);
    if (ref) matches.push(ref);
  }

  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

export function normalizeForMatch(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTranslationCode(code: string): TranslationCode {
  const c = String(code || "kjv").toLowerCase().trim();
  return TRANSLATION_OPTIONS.some((t) => t.code === c) ? (c as TranslationCode) : "kjv";
}

export function translationLabel(code: string) {
  const c = normalizeTranslationCode(code);
  const found = TRANSLATION_OPTIONS.find((t) => t.code === c);
  return found ? found.label : c.toUpperCase();
}

function storageKeyForLabel(label: string, translation: string) {
  const t = normalizeTranslationCode(translation);
  return `bible_cache:${t}:${label}`;
}

function safeLocalGet(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as { text?: string };
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function extractTextFromBibleApi(data: Record<string, unknown> | null) {
  if (!data) return null;
  if (typeof data.text === "string") return data.text.trim();

  if (Array.isArray(data.verses)) {
    return (data.verses as Array<{ text?: string; verse?: number }>)
      .map((v) => {
        const t = (v?.text ? String(v.text) : "").trim();
        if (!t) return "";
        const num = v?.verse ? String(v.verse) : null;
        return num ? `${num} ${t}` : t;
      })
      .filter(Boolean)
      .join("\n");
  }

  for (const k of ["chapter", "data", "body"]) {
    const v = data[k];
    if (typeof v === "string") return v.trim();
  }
  return null;
}

async function fetchBibleQuery(query: string, translation: string) {
  const t = normalizeTranslationCode(translation);
  const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${encodeURIComponent(t)}&output=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bible API HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const text = extractTextFromBibleApi(data);
  const reference = data.reference || data.verses_reference;
  return { text, reference: reference ? String(reference) : query };
}

export async function getTextForReference(
  ref: ScriptureRef,
  opts: { translation?: string } = {},
) {
  const translation = normalizeTranslationCode(opts.translation || "kjv");
  const label = ref.label || formatReferenceLabel(ref);
  const cacheKey = storageKeyForLabel(label, translation);

  const cached = safeLocalGet(cacheKey);
  if (cached?.text) {
    return {
      label,
      text: cached.text,
      source: "cache" as const,
      translation,
      translationLabel: translationLabel(translation),
    };
  }

  let text = "";

  if (ref.mode === "chapter") {
    const query = `${ref.bookApi} ${ref.chapter}`;
    const data = await fetchBibleQuery(query, translation);
    text = data.text || "";
  } else if (ref.mode === "verse") {
    const query = `${ref.bookApi} ${ref.chapter}:${ref.verseStart}`;
    const data = await fetchBibleQuery(query, translation);
    text = data.text || "";
  } else {
    const queryTry = `${ref.bookApi} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
    try {
      const data = await fetchBibleQuery(queryTry, translation);
      if (data.text) text = data.text;
    } catch {
      // fallback below
    }

    if (!text && ref.verseStart !== undefined && ref.verseEnd !== undefined) {
      const parts: string[] = [];
      for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
        const query = `${ref.bookApi} ${ref.chapter}:${v}`;
        const data = await fetchBibleQuery(query, translation);
        parts.push(data.text || `(${v})`);
      }
      text = parts.join("\n");
    }
  }

  text = (text || "").replace(/\s+\n/g, "\n").trim();
  safeLocalSet(cacheKey, { text, translation, savedAt: Date.now() });
  return {
    label,
    text,
    source: "api" as const,
    translation,
    translationLabel: translationLabel(translation),
  };
}

export async function fetchScripture(reference: string, translation = "kjv"): Promise<ScripturePassage> {
  const ref = extractLatestReference(reference) || parseTypedReference(reference);
  if (!ref) {
    throw new Error("Enter a scripture reference like John 3:16");
  }

  const result = await getTextForReference(ref, { translation });
  const verses = result.text
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^(\d+)\s+(.+)$/);
      if (m) {
        return {
          book_name: ref.bookSlug,
          chapter: ref.chapter,
          verse: parseInt(m[1], 10),
          text: m[2],
        };
      }
      return {
        book_name: ref.bookSlug,
        chapter: ref.chapter,
        verse: i + 1,
        text: line,
      };
    });

  return {
    reference: result.label,
    text: result.text,
    verses,
    translation_name: result.translationLabel,
  };
}

function parseTypedReference(input: string): ScriptureRef | null {
  const normalized = input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/chapter/gi, "")
    .replace(/verse/gi, "")
    .replace(/verses/gi, "");

  const ref = extractLatestReference(normalized);
  if (ref) return ref;

  const m = normalized.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;

  const bookPart = m[1].trim().toLowerCase();
  const book = BOOK_UI.find(
    (b) => b.api === bookPart || b.label.toLowerCase() === bookPart,
  );
  if (!book) return null;

  const chapter = parseInt(m[2], 10);
  const verseStart = m[3] ? parseInt(m[3], 10) : undefined;
  const verseEnd = m[4] ? parseInt(m[4], 10) : undefined;

  if (!verseStart) {
    const r: ScriptureRef = {
      mode: "chapter",
      bookSlug: book.label,
      bookApi: book.api,
      chapter,
      label: "",
    };
    r.label = formatReferenceLabel(r);
    return r;
  }

  if (verseEnd) {
    const r: ScriptureRef = {
      mode: "range",
      bookSlug: book.label,
      bookApi: book.api,
      chapter,
      verseStart,
      verseEnd,
      label: "",
    };
    r.label = formatReferenceLabel(r);
    return r;
  }

  const r: ScriptureRef = {
    mode: "verse",
    bookSlug: book.label,
    bookApi: book.api,
    chapter,
    verseStart,
    label: "",
  };
  r.label = formatReferenceLabel(r);
  return r;
}

export function readCachedVerses() {
  if (typeof window === "undefined") return [];
  const rows: Array<{ label: string; text: string; translation: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      let label = "";
      let translation = "kjv";
      const nextMatch = key.match(/^bible_cache:([a-z0-9_]+):(.+)$/i);
      if (nextMatch) {
        translation = String(nextMatch[1]).toLowerCase();
        label = nextMatch[2];
      } else if (key.startsWith("kjv_cache:")) {
        label = key.replace("kjv_cache:", "");
        translation = "kjv";
      } else {
        continue;
      }

      let parsed: { text?: string } | null = null;
      try {
        parsed = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        parsed = null;
      }
      const text = parsed?.text ? String(parsed.text) : "";
      if (!label || !text) continue;
      rows.push({ label, text, translation });
    }
  } catch {
    return [];
  }
  return rows;
}

export function postScriptureMessage(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(payload);
  channel.close();
}

export function postBackgroundMessage(backgroundUrl: string, backgroundOverlay: number) {
  postScriptureMessage({
    type: "background",
    backgroundUrl,
    backgroundOverlay,
    at: Date.now(),
  });
}

export function postProjectionMessage(
  ref: ScriptureRef,
  text: string,
  translation: string,
  translationLabelName: string,
  backgroundUrl: string,
  backgroundOverlay: number,
) {
  postScriptureMessage({
    type: "scripture",
    referenceLabel: ref.label,
    scriptureText: text,
    mode: ref.mode,
    translation,
    translationLabel: translationLabelName,
    backgroundUrl,
    backgroundOverlay,
    at: Date.now(),
  });
}

export function postAnnotationMessage(
  action: string,
  lineIndexes: number[],
  applyAll: boolean,
  query = "",
) {
  postScriptureMessage({
    type: "annotation",
    action,
    lineIndexes,
    applyAll,
    query,
    at: Date.now(),
  });
}

// Legacy export for backward compatibility
export const SCRIPTURE_CHANNEL = CHANNEL_NAME;
