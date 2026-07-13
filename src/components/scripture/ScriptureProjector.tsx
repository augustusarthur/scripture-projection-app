"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CHANNEL_NAME, fetchScripture } from "@/lib/scripture";

type LineMark = { underline: boolean; highlight: boolean };

const PROJ_MIN_REF_PX = 8;
const PROJ_MIN_TEXT_PX = 10;
const BG_STORAGE = "projection_background_image";
const BG_OVERLAY_STORAGE = "projection_background_overlay";

export function ScriptureProjector() {
  const searchParams = useSearchParams();
  const [referenceLabel, setReferenceLabel] = useState("Waiting for reference…");
  const [isLive, setIsLive] = useState(false);
  const [showIdle, setShowIdle] = useState(true);
  const [lines, setLines] = useState<string[]>([]);
  const [lineMarks, setLineMarks] = useState<LineMark[]>([]);
  const [loading, setLoading] = useState(false);

  const fittableRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function splitVerseLines(text: string) {
    return String(text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function resetScriptureText(text: string) {
    const newLines = splitVerseLines(text);
    setLines(newLines);
    setLineMarks(newLines.map(() => ({ underline: false, highlight: false })));
    scheduleFitProjection();
  }

  function applyBackground(url: string) {
    const bg = String(url || "").trim();
    if (!bg) {
      document.body.classList.remove("projectionBackground");
      document.body.style.backgroundImage = "";
      return;
    }
    document.body.classList.add("projectionBackground");
    document.body.style.backgroundImage = `url("${bg}")`;
  }

  function applyOverlay(value: number) {
    if (!Number.isFinite(value)) return;
    const clamped = Math.max(0.2, Math.min(0.9, value));
    document.documentElement.style.setProperty("--bg-overlay-opacity", String(clamped));
  }

  function applyAnnotation(msg: {
    action?: string;
    lineIndexes?: number[];
    applyAll?: boolean;
  }) {
    if (!lines.length) return;
    const action = msg?.action ? String(msg.action) : "";
    const applyAll = !!msg?.applyAll;
    const indexes = applyAll
      ? lines.map((_, i) => i)
      : Array.isArray(msg?.lineIndexes)
        ? msg.lineIndexes.filter((n) => Number.isInteger(n) && n >= 0 && n < lines.length)
        : [];
    if (!indexes.length) return;

    setLineMarks((prev) => {
      const next = [...prev];
      for (const idx of indexes) {
        if (!next[idx]) next[idx] = { underline: false, highlight: false };
        if (action === "underline") next[idx] = { ...next[idx], underline: true };
        else if (action === "highlight") next[idx] = { ...next[idx], highlight: true };
        else if (action === "removeUnderline") next[idx] = { ...next[idx], underline: false };
        else if (action === "removeHighlight") next[idx] = { ...next[idx], highlight: false };
      }
      return next;
    });
    scheduleFitProjection();
  }

  function fitProjectionToViewport() {
    const fittable = fittableRef.current;
    const wrap = wrapRef.current;
    if (!fittable || !wrap) return;

    const cs = getComputedStyle(wrap);
    const pt = parseFloat(cs.paddingTop) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    const maxW = Math.max(48, wrap.clientWidth - pl - pr);
    const maxH = Math.max(48, wrap.clientHeight - pt - pb);

    const vh = window.innerHeight;
    const refMax = Math.min(120, vh * 0.086);
    const textMax = Math.min(190, vh * 0.11);

    let lo = 0.035;
    let hi = 1;
    let best = lo;

    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      const refPx = Math.max(PROJ_MIN_REF_PX, mid * refMax);
      const textPx = Math.max(PROJ_MIN_TEXT_PX, mid * textMax);
      fittable.style.setProperty("--proj-ref-px", `${refPx}px`);
      fittable.style.setProperty("--proj-text-px", `${textPx}px`);

      const oh = fittable.scrollHeight;
      const ow = fittable.scrollWidth;

      if (oh <= maxH + 1 && ow <= maxW + 1) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const refPx = Math.max(PROJ_MIN_REF_PX, best * refMax);
    const textPx = Math.max(PROJ_MIN_TEXT_PX, best * textMax);
    fittable.style.setProperty("--proj-ref-px", `${refPx}px`);
    fittable.style.setProperty("--proj-text-px", `${textPx}px`);
  }

  let fitQueued = false;
  function scheduleFitProjection() {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(() => {
      fitQueued = false;
      fitProjectionToViewport();
      requestAnimationFrame(fitProjectionToViewport);
    });
  }

  useEffect(() => {
    document.body.classList.add("projectionPage");

    try {
      const savedBg = localStorage.getItem(BG_STORAGE);
      if (savedBg) applyBackground(savedBg);
      const savedOverlay = localStorage.getItem(BG_OVERLAY_STORAGE);
      if (savedOverlay) applyOverlay(Number(savedOverlay));
    } catch {
      // ignore
    }

    try {
      const last = localStorage.getItem("kjv_last_projection");
      if (last) {
        const parsed = JSON.parse(last);
        const refText = parsed.referenceLabel || "Reference";
        const tr = parsed.translationLabel ? ` (${parsed.translationLabel})` : "";
        setReferenceLabel(`${refText}${tr}`);
        resetScriptureText(parsed.scriptureText || "");
        setShowIdle(false);
        setIsLive(true);
        if (parsed.backgroundUrl) applyBackground(parsed.backgroundUrl);
        if (parsed.backgroundOverlay !== undefined) applyOverlay(parsed.backgroundOverlay);
      }
    } catch {
      // ignore
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const msg = event?.data;
      if (!msg) return;

      if (msg.type === "background") {
        applyBackground(msg.backgroundUrl || "");
        if (msg.backgroundOverlay !== undefined) applyOverlay(msg.backgroundOverlay);
        try {
          localStorage.setItem(BG_STORAGE, msg.backgroundUrl || "");
          if (msg.backgroundOverlay !== undefined) {
            localStorage.setItem(BG_OVERLAY_STORAGE, String(msg.backgroundOverlay));
          }
        } catch {
          // ignore
        }
        return;
      }

      if (msg.type === "scripture") {
        const refText = msg.referenceLabel || "Reference";
        const tr = msg.translationLabel ? ` (${msg.translationLabel})` : "";
        setReferenceLabel(`${refText}${tr}`);
        resetScriptureText(msg.scriptureText || "");
        setShowIdle(false);
        setIsLive(true);

        if (msg.backgroundUrl !== undefined) {
          applyBackground(msg.backgroundUrl || "");
          try {
            localStorage.setItem(BG_STORAGE, msg.backgroundUrl || "");
          } catch {
            // ignore
          }
        }
        if (msg.backgroundOverlay !== undefined) {
          applyOverlay(msg.backgroundOverlay);
          try {
            localStorage.setItem(BG_OVERLAY_STORAGE, String(msg.backgroundOverlay));
          } catch {
            // ignore
          }
        }

        try {
          localStorage.setItem("kjv_last_projection", JSON.stringify(msg));
        } catch {
          // ignore
        }
        return;
      }

      if (msg.type === "annotation") {
        applyAnnotation(msg);
      }
    };

    const ref = searchParams.get("ref");
    if (ref) {
      setLoading(true);
      const translation = searchParams.get("translation") || "kjv";
      fetchScripture(ref, translation)
        .then((data) => {
          setReferenceLabel(`${data.reference} (${data.translation_name})`);
          resetScriptureText(data.text);
          setShowIdle(false);
          setIsLive(true);
        })
        .finally(() => setLoading(false));
    }

    const onResize = () => scheduleFitProjection();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => {
      window.setTimeout(scheduleFitProjection, 200);
    });
    scheduleFitProjection();

    return () => {
      channel.close();
      document.body.classList.remove("projectionPage", "projectionBackground");
      window.removeEventListener("resize", onResize);
    };
  }, [searchParams]);

  useEffect(() => {
    scheduleFitProjection();
  }, [lines, lineMarks]);

  if (loading) {
    return (
      <div className="projectionWrap" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <p className="idle mono">Loading scripture...</p>
      </div>
    );
  }

  return (
    <div className="projectionWrap" ref={wrapRef}>
      <div className="projectionFittable" ref={fittableRef}>
        <div className={`reference mono${isLive ? " projectionReferenceLive" : ""}`}>
          {referenceLabel}
        </div>
        <div className="text">
          {lines.map((line, idx) => {
            const mark = lineMarks[idx] || { underline: false, highlight: false };
            return (
              <div
                key={idx}
                className={`verseLine${mark.underline ? " lineUnderline" : ""}${mark.highlight ? " lineHighlight" : ""}`}
              >
                {line}
              </div>
            );
          })}
        </div>
        {showIdle && (
          <div className="idle mono" style={{ marginTop: 26 }}>
            Put this tab on your projector/second monitor.
          </div>
        )}
      </div>
    </div>
  );
}
