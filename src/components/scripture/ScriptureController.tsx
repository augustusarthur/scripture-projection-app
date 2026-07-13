"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  Mic,
  MicOff,
  Monitor,
  Search,
} from "lucide-react";
import type { ScripturePassage } from "@/lib/scripture";
import { SCRIPTURE_CHANNEL } from "@/lib/scripture";

export function ScriptureController() {
  const [reference, setReference] = useState("");
  const [passage, setPassage] = useState<ScripturePassage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const channel =
    typeof window !== "undefined"
      ? new BroadcastChannel(SCRIPTURE_CHANNEL)
      : null;

  const sendToProjector = useCallback(
    (data: ScripturePassage) => {
      channel?.postMessage({ type: "show", passage: data });
      try {
        localStorage.setItem(
          "scripture-display",
          JSON.stringify({ passage: data, at: Date.now() }),
        );
      } catch {
        // ignore storage errors
      }
    },
    [channel],
  );

  const lookup = useCallback(
    async (ref: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/scripture?ref=${encodeURIComponent(ref)}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Lookup failed");
        }

        setPassage(data);
        sendToProjector(data);
      } catch (lookupError) {
        setPassage(null);
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "Lookup failed",
        );
      } finally {
        setLoading(false);
      }
    },
    [sendToProjector],
  );

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window ||
          "webkitSpeechRecognition" in window),
    );

    return () => channel?.close();
  }, [channel]);

  function startListening() {
    if (!speechSupported) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Could not hear that. Try again or type the reference.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setReference(transcript);
      lookup(transcript);
    };

    recognition.start();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (reference.trim()) lookup(reference);
  }

  const projectorUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/scripture/project`
      : "/scripture/project";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Scripture Projector</h1>
        <p className="mt-2 text-stone-600">
          Speak or type a reference to show it on the projection screen.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">
              Scripture reference
            </span>
            <div className="flex gap-2">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="John 3:16"
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {loading ? "..." : "Show"}
              </button>
            </div>
          </label>

          {speechSupported ? (
            <button
              type="button"
              onClick={startListening}
              disabled={listening}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-60"
            >
              {listening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Speak a reference
                </>
              )}
            </button>
          ) : null}
        </form>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <Monitor className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="flex-1">
            <h2 className="font-semibold text-amber-950">Projection screen</h2>
            <p className="mt-1 text-sm text-amber-900">
              Open this link on your projector, TV, or second device. When you
              look up a verse here, it appears there automatically.
            </p>
            <a
              href={
                passage
                  ? `${projectorUrl}?ref=${encodeURIComponent(passage.reference)}`
                  : projectorUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-950"
            >
              Open projection screen
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {passage ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
            {passage.reference} · {passage.translation_name}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-stone-800">
            {passage.text}
          </p>
        </div>
      ) : null}

      <p className="text-center text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-700">
          ← Back to Shepherd Connect
        </Link>
      </p>
    </div>
  );
}

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  start: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
