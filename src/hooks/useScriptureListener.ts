"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKGROUND_IMAGES,
  BOOK_UI,
  CHANNEL_NAME,
  TRANSLATION_OPTIONS,
  backgroundUrlFromFile,
  extractLatestReference,
  formatReferenceLabel,
  getTextForReference,
  normalizeForMatch,
  postAnnotationMessage,
  postBackgroundMessage,
  postProjectionMessage,
  readCachedVerses,
  translationLabel,
  type ScriptureRef,
} from "@/lib/scripture";

type SermonNote = { time: string; text: string };
type RecentRef = { label: string; refObj: ScriptureRef };
type Possibility = { label: string; refObj: ScriptureRef; snippet?: string };

const MAX_DETECTED = 10;
const MAX_NOTES = 80;
const BG_STORAGE = "projection_background_image";
const BG_OVERLAY_STORAGE = "projection_background_overlay";

function formatTimeStamp(date = new Date()) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatNoteText(rawText: string) {
  const cleaned = String(rawText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  let out = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

function snippetFromText(text: string, maxChars = 180) {
  const cleaned = String(text || "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars)}...`;
}

function buildNextReference(current: ScriptureRef | null): ScriptureRef | null {
  if (!current?.bookSlug || !current.bookApi) return null;

  if (current.mode === "verse" && current.verseStart !== undefined) {
    const next: ScriptureRef = {
      mode: "verse",
      bookSlug: current.bookSlug,
      bookApi: current.bookApi,
      chapter: current.chapter,
      verseStart: current.verseStart + 1,
      label: "",
    };
    next.label = formatReferenceLabel(next);
    return next;
  }

  if (current.mode === "range" && current.verseStart !== undefined && current.verseEnd !== undefined) {
    const span = Math.max(1, current.verseEnd - current.verseStart);
    const next: ScriptureRef = {
      mode: "range",
      bookSlug: current.bookSlug,
      bookApi: current.bookApi,
      chapter: current.chapter,
      verseStart: current.verseStart + 1,
      verseEnd: current.verseStart + 1 + span,
      label: "",
    };
    next.label = formatReferenceLabel(next);
    return next;
  }

  if (current.mode === "chapter") {
    const next: ScriptureRef = {
      mode: "chapter",
      bookSlug: current.bookSlug,
      bookApi: current.bookApi,
      chapter: current.chapter + 1,
      label: "",
    };
    next.label = formatReferenceLabel(next);
    return next;
  }

  return null;
}

function isNextVerseCommand(text: string) {
  const n = normalizeForMatch(text);
  return (
    n.includes("next verse") ||
    n.includes("go to next verse") ||
    n.includes("show next verse") ||
    n.includes("next scripture")
  );
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ [index: number]: { transcript: string }; isFinal: boolean }>;
  }) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useScriptureListener() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [listening, setListening] = useState(false);
  const [engineStatus, setEngineStatus] = useState("SpeechRecognition: unknown");
  const [sermonNotes, setSermonNotes] = useState<SermonNote[]>([]);
  const [recentRefs, setRecentRefs] = useState<RecentRef[]>([]);
  const [detectedMode, setDetectedMode] = useState("Listening…");
  const [translation, setTranslation] = useState("kjv");
  const [searchTab, setSearchTab] = useState<"dropdowns" | "reference" | "passphrase">("reference");
  const [refSearchInput, setRefSearchInput] = useState("");
  const [refSearchStatus, setRefSearchStatus] = useState("Ready.");
  const [bookApi, setBookApi] = useState("john");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [cachedSearchInput, setCachedSearchInput] = useState("");
  const [cachedSearchStatus, setCachedSearchStatus] = useState("Enter a search term.");
  const [cachedResults, setCachedResults] = useState<
    Array<{ label: string; text: string; translation: string }>
  >([]);
  const [cachedCount, setCachedCount] = useState(0);
  const [possibilities, setPossibilities] = useState<Possibility[]>([]);
  const [possibilitiesStatus, setPossibilitiesStatus] = useState("Waiting…");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundOverlay, setBackgroundOverlay] = useState(0.58);
  const [bookSuggestions, setBookSuggestions] = useState<
    Array<{ label: string; api: string }>
  >([]);

  const lastProjectedRef = useRef<ScriptureRef | null>(null);
  const lastProjectedLabel = useRef<string | null>(null);
  const lastProjectedText = useRef("");
  const transcriptBuffer = useRef("");
  const listeningRequested = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const restartDelayRef = useRef(500);
  const projectionRequestId = useRef(0);

  const applyTheme = useCallback((t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "");
    try {
      localStorage.setItem("ui_theme", t);
    } catch {
      // ignore
    }
  }, []);

  const addOrPromoteReference = useCallback((refObj: ScriptureRef) => {
    const label = refObj.label;
    if (!label) return;
    setRecentRefs((prev) => {
      const filtered = prev.filter((r) => r.label !== label);
      return [{ label, refObj }, ...filtered].slice(0, MAX_DETECTED);
    });
  }, []);

  const projectReference = useCallback(
    async (refObj: ScriptureRef, opts: { translation?: string } = {}) => {
      if (!refObj?.label) return;
      const myRequestId = ++projectionRequestId.current;
      const t = opts.translation || translation;
      const tLabel = translationLabel(t);

      setDetectedMode(`Mode: ${refObj.mode} (${tLabel}, projecting…)`);

      try {
        const { text } = await getTextForReference(refObj, { translation: t });
        if (myRequestId !== projectionRequestId.current) return;

        lastProjectedLabel.current = refObj.label;
        lastProjectedRef.current = { ...refObj };
        lastProjectedText.current = text || "";

        postProjectionMessage(
          refObj,
          text,
          t,
          tLabel,
          backgroundUrl,
          backgroundOverlay,
        );

        setDetectedMode(`Mode: ${refObj.mode} (${tLabel})`);
        setCachedCount(readCachedVerses().length);
      } catch (e) {
        setDetectedMode(
          `Fetch failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [translation, backgroundUrl, backgroundOverlay],
  );

  const projectRefFromUser = useCallback(
    async (refObj: ScriptureRef) => {
      addOrPromoteReference(refObj);
      setPossibilities([]);
      setPossibilitiesStatus("Waiting…");
      await projectReference(refObj);
    },
    [addOrPromoteReference, projectReference],
  );

  const tryProjectFromInput = useCallback(async () => {
    const raw = refSearchInput.trim();
    if (!raw) return;

    const ref = extractLatestReference(raw);
    if (!ref?.label) {
      setRefSearchStatus(`Could not parse: "${raw}"`);
      return;
    }

    setRefSearchStatus(`Projecting ${ref.label}…`);
    await projectRefFromUser(ref);
    setRefSearchStatus(`Projected: ${ref.label}`);
  }, [refSearchInput, projectRefFromUser]);

  const handleFinalTranscript = useCallback(
    async (finalText: string) => {
      const noteText = formatNoteText(finalText);
      if (noteText) {
        setSermonNotes((prev) =>
          [...prev, { time: formatTimeStamp(), text: noteText }].slice(-MAX_NOTES),
        );
      }

      if (isNextVerseCommand(finalText)) {
        if (!lastProjectedRef.current) {
          setDetectedMode("No active scripture yet. Say a reference first.");
          return;
        }
        const nextRef = buildNextReference(lastProjectedRef.current);
        if (!nextRef) return;
        addOrPromoteReference(nextRef);
        await projectReference(nextRef);
        return;
      }

      transcriptBuffer.current = `${transcriptBuffer.current} ${finalText}`.trim().slice(-6000);

      const refFromChunk = extractLatestReference(finalText);
      const refFromRecent = extractLatestReference(transcriptBuffer.current.slice(-1200));
      const ref = refFromChunk || refFromRecent;

      if (!ref?.label) return;
      if (ref.label === lastProjectedLabel.current) return;

      addOrPromoteReference(ref);
      await projectReference(ref);

      const alts: Possibility[] = [{ label: ref.label, refObj: ref }];
      if (ref.mode === "verse") {
        const chapterAlt: ScriptureRef = {
          mode: "chapter",
          bookSlug: ref.bookSlug,
          bookApi: ref.bookApi,
          chapter: ref.chapter,
          label: `${ref.bookSlug} ${ref.chapter}`,
        };
        alts.push({ label: chapterAlt.label, refObj: chapterAlt });
      }
      setPossibilities(alts);
      setPossibilitiesStatus(`Detected: ${ref.label}`);

      for (const p of alts) {
        try {
          const { text } = await getTextForReference(p.refObj, { translation });
          setPossibilities((prev) =>
            prev.map((item) =>
              item.label === p.label ? { ...item, snippet: snippetFromText(text) } : item,
            ),
          );
        } catch {
          // ignore
        }
      }
    },
    [addOrPromoteReference, projectReference, translation],
  );

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRestart = useCallback(
    (reason: string) => {
      if (!listeningRequested.current) return;
      clearRestartTimer();
      const delay = restartDelayRef.current;
      restartDelayRef.current = Math.min(8000, Math.floor(restartDelayRef.current * 1.6));
      setEngineStatus(
        `SpeechRecognition ended (${reason}). Restarting in ${Math.round(delay / 1000)}s…`,
      );
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (!listeningRequested.current) return;
        try {
          recognitionRef.current?.start();
        } catch {
          scheduleRestart("start failed");
        }
      }, delay);
    },
    [clearRestartTimer],
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setEngineStatus("SpeechRecognition not supported in this browser.");
      return;
    }

    listeningRequested.current = true;
    restartDelayRef.current = 500;
    clearRestartTimer();

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      restartDelayRef.current = 500;
      setEngineStatus("SpeechRecognition: running");
      setListening(true);
    };

    recognition.onend = () => {
      if (!listeningRequested.current) return;
      scheduleRestart("ended");
    };

    recognition.onerror = (event) => {
      setEngineStatus(`SpeechRecognition error: ${event.error}. Restarting…`);
      setListening(false);
      scheduleRestart(event?.error || "error");
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (text && result.isFinal) {
          void handleFinalTranscript(text);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [clearRestartTimer, handleFinalTranscript, scheduleRestart]);

  const stopListening = useCallback(() => {
    listeningRequested.current = false;
    clearRestartTimer();
    setListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, [clearRestartTimer]);

  const runCachedSearch = useCallback(() => {
    const q = cachedSearchInput.trim();
    if (!q) {
      setCachedSearchStatus("Enter a search term.");
      setCachedResults([]);
      return;
    }

    const direct = extractLatestReference(q);
    if (direct?.label) {
      setCachedSearchStatus(`Direct reference: ${direct.label}`);
      void projectRefFromUser(direct);
    }

    const qn = normalizeForMatch(q);
    const cached = readCachedVerses();
    const scored = cached
      .map((row) => {
        const ln = normalizeForMatch(row.label);
        const tn = normalizeForMatch(row.text);
        let score = 0;
        if (ln.includes(qn)) score += 8;
        if (tn.includes(qn)) score += 5;
        for (const t of qn.split(" ").filter(Boolean)) {
          if (ln.includes(t)) score += 2;
          if (tn.includes(t)) score += 1;
        }
        return { ...row, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    setCachedResults(scored);
    setCachedSearchStatus(
      scored.length
        ? `Found ${scored.length} result(s) from cached verses.`
        : "No cached matches yet. Project more verses first.",
    );
  }, [cachedSearchInput, projectRefFromUser]);

  const submitBookChapterVerse = useCallback(async () => {
    const book = BOOK_UI.find((b) => b.api === bookApi);
    const ch = Number(chapter);
    if (!book || !Number.isFinite(ch) || ch <= 0) {
      setRefSearchStatus("Pick a book + chapter (verse optional).");
      return;
    }

    const vRaw = verse.trim();
    const v = vRaw === "" ? null : Number(vRaw);
    let refObj: ScriptureRef;

    if (v === null || !Number.isFinite(v) || v <= 0) {
      refObj = {
        mode: "chapter",
        bookSlug: book.label,
        bookApi: book.api,
        chapter: ch,
        label: `${book.label} ${ch}`,
      };
    } else {
      refObj = {
        mode: "verse",
        bookSlug: book.label,
        bookApi: book.api,
        chapter: ch,
        verseStart: v,
        label: `${book.label} ${ch}:${v}`,
      };
    }

    setRefSearchStatus(`Projecting ${refObj.label}…`);
    await projectRefFromUser(refObj);
    setRefSearchStatus(`Projected: ${refObj.label}`);
  }, [bookApi, chapter, verse, projectRefFromUser]);

  const selectBackground = useCallback(
    (url: string) => {
      setBackgroundUrl(url);
      try {
        localStorage.setItem(BG_STORAGE, url);
      } catch {
        // ignore
      }
      postBackgroundMessage(url, backgroundOverlay);
    },
    [backgroundOverlay],
  );

  const updateOverlay = useCallback(
    (value: number) => {
      setBackgroundOverlay(value);
      try {
        localStorage.setItem(BG_OVERLAY_STORAGE, String(value));
      } catch {
        // ignore
      }
      postBackgroundMessage(backgroundUrl, value);
    },
    [backgroundUrl],
  );

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("ui_theme");
      applyTheme(savedTheme === "light" ? "light" : "dark");
    } catch {
      applyTheme("dark");
    }

    try {
      const savedTranslation = localStorage.getItem("bible_translation_selected") || "kjv";
      setTranslation(savedTranslation);
    } catch {
      // ignore
    }

    try {
      const savedBg = localStorage.getItem(BG_STORAGE) || "";
      const savedOverlay = Number(localStorage.getItem(BG_OVERLAY_STORAGE) || "0.58");
      setBackgroundUrl(savedBg);
      setBackgroundOverlay(
        Number.isFinite(savedOverlay) ? Math.max(0.35, Math.min(0.85, savedOverlay)) : 0.58,
      );
      postBackgroundMessage(savedBg, savedOverlay);
    } catch {
      // ignore
    }

    setCachedCount(readCachedVerses().length);

    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    setEngineStatus(
      SpeechRecognitionCtor ? "SpeechRecognition: ready" : "SpeechRecognition: unsupported",
    );

    return () => {
      listeningRequested.current = false;
      clearRestartTimer();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [applyTheme, clearRestartTimer]);

  useEffect(() => {
    try {
      localStorage.setItem("bible_translation_selected", translation);
    } catch {
      // ignore
    }
  }, [translation]);

  useEffect(() => {
    const raw = refSearchInput.trim();
    if (!raw) {
      setBookSuggestions([]);
      return;
    }
    const norm = normalizeForMatch(raw);
    const tokens = norm.split(" ");
    const first = tokens[0] || "";
    const ordinalPrefix =
      first === "1" || first === "2" || first === "3" ||
      first === "first" || first === "second" || first === "third";
    const usedPrefix = ordinalPrefix && tokens.length >= 2 ? `${tokens[0]} ${tokens[1]}` : tokens[0];
    const usedPrefixNorm = normalizeForMatch(usedPrefix);

    const results: Array<{ label: string; api: string }> = [];
    for (const b of BOOK_UI) {
      const labelNorm = normalizeForMatch(b.label);
      const apiNorm = normalizeForMatch(b.api);
      if (labelNorm.startsWith(usedPrefixNorm) || apiNorm.startsWith(usedPrefixNorm)) {
        results.push({ label: b.label, api: b.api });
      }
      if (results.length >= 8) break;
    }
    setBookSuggestions(results);
  }, [refSearchInput]);

  return {
    theme,
    applyTheme,
    listening,
    engineStatus,
    sermonNotes,
    recentRefs,
    detectedMode,
    translation,
    setTranslation,
    searchTab,
    setSearchTab,
    refSearchInput,
    setRefSearchInput,
    refSearchStatus,
    bookApi,
    setBookApi,
    chapter,
    setChapter,
    verse,
    setVerse,
    cachedSearchInput,
    setCachedSearchInput,
    cachedSearchStatus,
    cachedResults,
    cachedCount,
    possibilities,
    possibilitiesStatus,
    backgroundUrl,
    backgroundOverlay,
    bookSuggestions,
    startListening,
    stopListening,
    tryProjectFromInput,
    runCachedSearch,
    submitBookChapterVerse,
    projectRefFromUser,
    selectBackground,
    updateOverlay,
    randomBackground: () => {
      const file = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
      selectBackground(backgroundUrlFromFile(file));
    },
  };
}

export { CHANNEL_NAME, BACKGROUND_IMAGES, backgroundUrlFromFile, BOOK_UI, TRANSLATION_OPTIONS };
