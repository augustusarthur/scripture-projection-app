"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ScripturePassage } from "@/lib/scripture";
import { SCRIPTURE_CHANNEL } from "@/lib/scripture";

export function ScriptureProjector() {
  const searchParams = useSearchParams();
  const [passage, setPassage] = useState<ScripturePassage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(SCRIPTURE_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data?.type === "show" && event.data.passage) {
        setPassage(event.data.passage);
      }
    };

    try {
      const stored = localStorage.getItem("scripture-display");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.passage) setPassage(parsed.passage);
      }
    } catch {
      // ignore
    }

    const ref = searchParams.get("ref");
    if (ref) {
      setLoading(true);
      fetch(`/api/scripture?ref=${encodeURIComponent(ref)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.reference) setPassage(data);
        })
        .finally(() => setLoading(false));
    }

    return () => channel.close();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-2xl text-stone-400">Loading scripture...</p>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
        <p className="text-3xl font-light text-stone-300">Scripture Projector</p>
        <p className="mt-4 max-w-xl text-lg text-stone-500">
          Waiting for a verse from the controller. Open the controller on your
          phone or laptop and speak or type a reference.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-black px-8 py-12 text-white md:px-16 lg:px-24">
      <p className="text-center text-2xl font-semibold tracking-wide text-amber-400 md:text-3xl">
        {passage.reference}
      </p>
      <p className="mt-2 text-center text-sm uppercase tracking-[0.2em] text-stone-500">
        {passage.translation_name}
      </p>
      <div className="mx-auto mt-10 max-w-5xl">
        <p className="text-center text-3xl leading-relaxed text-white md:text-5xl md:leading-tight lg:text-6xl">
          {passage.verses.map((verse) => (
            <span key={`${verse.chapter}-${verse.verse}`}>
              <sup className="mr-1 text-xl text-amber-400 md:text-2xl">
                {verse.verse}
              </sup>
              {verse.text}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
