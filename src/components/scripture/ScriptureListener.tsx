"use client";

import Link from "next/link";
import { extractLatestReference } from "@/lib/scripture";
import {
  BACKGROUND_IMAGES,
  BOOK_UI,
  TRANSLATION_OPTIONS,
  backgroundUrlFromFile,
  useScriptureListener,
} from "@/hooks/useScriptureListener";

function readableBackgroundName(fileName: string) {
  const stem = String(fileName || "")
    .replace(/^Paint_Sweeps_/, "")
    .replace(/-[^-]+\.png$/i, "")
    .replace(/_/g, " ")
    .trim();
  return stem || "Background";
}

export function ScriptureListener() {
  const s = useScriptureListener();

  const cachedReadiness =
    s.cachedCount === 0
      ? { className: "readinessIndicator--bad", title: "Not set up yet", detail: "Project some verses first so text is saved locally." }
      : s.cachedCount < 5
        ? { className: "readinessIndicator--warn", title: "Works — limited", detail: `${s.cachedCount} passage(s) cached.` }
        : { className: "readinessIndicator--ok", title: "Ready", detail: `${s.cachedCount} passages cached.` };

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Scripture Projection</div>
          <div className="status">Listening + detecting scripture references</div>
        </div>
        <div className="row" style={{ alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="themeSwitch" role="group" aria-label="Appearance">
            <button
              type="button"
              className="themeSwitchBtn"
              aria-pressed={s.theme === "dark"}
              onClick={() => s.applyTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className="themeSwitchBtn"
              aria-pressed={s.theme === "light"}
              onClick={() => s.applyTheme("light")}
            >
              Light
            </button>
          </div>
          <div className="status mono">{s.engineStatus}</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="dashboardGrid">
        <div className="dashboardLeft">
          <div className="card">
            <div style={{ fontWeight: 800 }}>Live transcript (latest)</div>
            <div className="listenBox">
              {s.sermonNotes.length === 0 ? (
                "—"
              ) : (
                s.sermonNotes.map((note, i) => (
                  <div key={i} className="noteLine">
                    <span className="noteTime mono">[{note.time}]</span>
                    <span className="noteBullet">•</span>
                    <span className="noteText">{note.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card quickVerseCard" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800 }}>Scripture search &amp; project</div>
            <div className="row" style={{ marginTop: 8 }}>
              <label className="status mono" htmlFor="translationSelect">
                Translation
              </label>
              <select
                id="translationSelect"
                className="compactSelect mono"
                value={s.translation}
                onChange={(e) => s.setTranslation(e.target.value)}
              >
                {TRANSLATION_OPTIONS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label} ({t.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ height: 8 }} />

            <div className="scriptureSearchTabBar" role="tablist" aria-label="Scripture search">
              {(["dropdowns", "reference", "passphrase"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="scriptureSearchTab"
                  role="tab"
                  aria-selected={s.searchTab === tab}
                  onClick={() => s.setSearchTab(tab)}
                >
                  {tab === "dropdowns"
                    ? "Search by dropdowns"
                    : tab === "reference"
                      ? "Search by reference"
                      : "Cached verses"}
                </button>
              ))}
            </div>

            {s.searchTab === "dropdowns" && (
              <div className="scriptureSearchPanel" role="tabpanel">
                <div className="status" style={{ marginBottom: 8 }}>
                  Book, chapter, optional verse — then Project.
                </div>
                <div className="row quickBcvRow">
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <select
                      className="quickControl fieldInput fieldInput--select mono"
                      value={s.bookApi}
                      onChange={(e) => s.setBookApi(e.target.value)}
                    >
                      {BOOK_UI.map((b) => (
                        <option key={b.api} value={b.api}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "0 0 120px", minWidth: 100 }}>
                    <input
                      className="mono quickControl fieldInput"
                      type="number"
                      min={1}
                      placeholder="Ch."
                      value={s.chapter}
                      onChange={(e) => s.setChapter(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && s.submitBookChapterVerse()}
                    />
                  </div>
                  <div style={{ flex: "0 0 120px", minWidth: 100 }}>
                    <input
                      className="mono quickControl fieldInput"
                      type="number"
                      min={0}
                      placeholder="Vs. (opt.)"
                      value={s.verse}
                      onChange={(e) => s.setVerse(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && s.submitBookChapterVerse()}
                    />
                  </div>
                  <button
                    type="button"
                    className="quickControl"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => s.submitBookChapterVerse()}
                  >
                    Project
                  </button>
                </div>
              </div>
            )}

            {s.searchTab === "reference" && (
              <div className="scriptureSearchPanel" role="tabpanel">
                <div className="status" style={{ marginBottom: 8 }}>
                  Type a reference (e.g. <code className="mono">John 3:16</code>) and press Go.
                </div>
                <div className="row" style={{ alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 360px" }}>
                    <input
                      className="mono fieldInput"
                      placeholder="e.g., John 3:16"
                      value={s.refSearchInput}
                      onChange={(e) => s.setRefSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void s.tryProjectFromInput();
                        }
                      }}
                    />
                    {s.bookSuggestions.length > 0 && (
                      <div className="autocompleteList mono" style={{ marginTop: 8 }}>
                        {s.bookSuggestions.map((item) => (
                          <button
                            key={item.api}
                            type="button"
                            className="autocompleteItem"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              s.setRefSearchInput(`${item.label} `);
                              s.setBookApi(item.api);
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => void s.tryProjectFromInput()}
                  >
                    Go
                  </button>
                </div>
              </div>
            )}

            {s.searchTab === "passphrase" && (
              <div className="scriptureSearchPanel" role="tabpanel">
                <p className="settingsCardLead" style={{ margin: "0 0 10px", maxWidth: "none" }}>
                  Search <em>words and phrases</em> inside Bible text you&apos;ve already loaded
                  here. Nothing is sent to the internet for this search.
                </p>
                <div
                  className={`readinessIndicator ${cachedReadiness.className}`}
                  role="status"
                >
                  <span className="readinessIndicatorIcon" aria-hidden="true">
                    ●
                  </span>
                  <div className="readinessIndicatorBody">
                    <div className="readinessIndicatorTitle">{cachedReadiness.title}</div>
                    <div className="readinessIndicatorDetail status">{cachedReadiness.detail}</div>
                  </div>
                </div>
                <div className="row" style={{ alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 420px" }}>
                    <input
                      className="mono fieldInput"
                      placeholder="e.g., John 3:16 or for God so loved the world"
                      value={s.cachedSearchInput}
                      onChange={(e) => s.setCachedSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && s.runCachedSearch()}
                    />
                  </div>
                  <button type="button" style={{ whiteSpace: "nowrap" }} onClick={s.runCachedSearch}>
                    Search
                  </button>
                </div>
                <div className="status mono" style={{ marginTop: 8 }}>
                  {s.cachedSearchStatus}
                </div>
                <div className="detectedList mono" style={{ marginTop: 10 }}>
                  {s.cachedResults.length === 0 ? (
                    <div className="idle">No results yet</div>
                  ) : (
                    s.cachedResults.map((item) => (
                      <button
                        key={`${item.translation}-${item.label}`}
                        type="button"
                        className="possibilityItem"
                        onClick={() => {
                          const ref = extractLatestReference(item.label);
                          if (ref) void s.projectRefFromUser(ref);
                        }}
                      >
                        <div className="possibilityLabel">
                          {item.label} ({item.translation.toUpperCase()})
                        </div>
                        <div className="possibilitySnippet">&quot;{item.text.slice(0, 120)}...&quot;</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="status" style={{ marginTop: 12 }}>
              {s.refSearchStatus}
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800 }}>Detected references (click to project)</div>
            <div className="status mono" style={{ marginTop: 6 }}>
              {s.detectedMode}
            </div>
            <div className="detectedList mono" style={{ marginTop: 12 }}>
              {s.recentRefs.length === 0 ? (
                <div className="idle">None yet</div>
              ) : (
                s.recentRefs.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="detectedItem mono"
                    onClick={() => void s.projectRefFromUser(item.refObj)}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboardMiddle">
          <div className="card">
            <div style={{ fontWeight: 800 }}>Projection Background</div>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="status mono">Background</span>
              <button type="button" className="compactBtn" onClick={s.randomBackground}>
                Random
              </button>
            </div>
            <div className="row" style={{ marginTop: 8, alignItems: "center" }}>
              <label className="status mono" htmlFor="backgroundOverlayInput">
                Darkness
              </label>
              <input
                id="backgroundOverlayInput"
                type="range"
                min={0.35}
                max={0.85}
                step={0.01}
                value={s.backgroundOverlay}
                onChange={(e) => s.updateOverlay(Number(e.target.value))}
              />
              <div className="status mono">{Math.round(s.backgroundOverlay * 100)}%</div>
            </div>
            <div className="backgroundThumbs" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={`backgroundThumb backgroundThumb--empty${!s.backgroundUrl ? " active" : ""}`}
                title="None (solid)"
                onClick={() => s.selectBackground("")}
              />
              {BACKGROUND_IMAGES.map((file) => {
                const url = backgroundUrlFromFile(file);
                return (
                  <button
                    key={file}
                    type="button"
                    className={`backgroundThumb${s.backgroundUrl === url ? " active" : ""}`}
                    style={{ backgroundImage: `url("${url}")` }}
                    title={readableBackgroundName(file)}
                    onClick={() => s.selectBackground(url)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="dashboardRight">
          <div className="card listeningRocketCard">
            <div className="listeningRocketTop">
              <div className="listeningRocketTopMain">
                <div className="settingsCardTitle">Listening</div>
                <p className="settingsCardLead listeningRocketLead">
                  Transcribe speech here; verses send to your projection tab.
                </p>
              </div>
              <button
                type="button"
                className={`rocketListenBtn${s.listening ? " rocketListenBtn--stop" : ""}`}
                onClick={() => (s.listening ? s.stopListening() : s.startListening())}
              >
                {s.listening ? "Stop Listening" : "Start Listening"}
              </button>
            </div>

            <div className="settingsCallout">
              <strong>Projection tab</strong> — Open{" "}
              <Link href="/scripture/project" className="mono" target="_blank">
                /scripture/project
              </Link>{" "}
              on your projector or second monitor. It listens on channel{" "}
              <code className="mono">scripture-projection</code>.
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800 }}>Possibilities (click to project)</div>
            <div className="status mono" style={{ marginTop: 6 }}>
              {s.possibilitiesStatus}
            </div>
            <div className="detectedList mono" style={{ marginTop: 12 }}>
              {s.possibilities.length === 0 ? (
                <div className="idle">No possibilities yet</div>
              ) : (
                s.possibilities.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="possibilityItem"
                    onClick={() => void s.projectRefFromUser(p.refObj)}
                  >
                    <div className="possibilityLabel">{p.label}</div>
                    {p.snippet ? (
                      <div className="possibilitySnippet">&quot;{p.snippet}&quot;</div>
                    ) : (
                      <div className="possibilitySnippet possibilityLoading">Loading snippet...</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="status" style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/">← Back to Shepherd Connect</Link>
      </p>
    </div>
  );
}
