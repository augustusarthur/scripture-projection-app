"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENDANCE_STORAGE_KEY,
  AttendanceState,
  AttendanceStatus,
  DEFAULT_ROSTER,
  DayAttendance,
  MAX_IMAGES_PER_SUBMISSION,
  ROSTER_STORAGE_KEY,
  Roster,
  SUBMISSIONS_STORAGE_KEY,
  SubmissionsState,
  WeekSubmission,
  buildAnalytics,
  compressImageFile,
  countRoster,
  emptySubmission,
  findGroupBySlug,
  formatGroupName,
  leaderLabel,
  leaderSlug,
  personKey,
  submissionKey,
  todayISODate,
} from "@/lib/attendance-roster";
import "./attendance.css";

type View = "home" | "leader" | "overview" | "dashboard";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function groupAttendance(
  dayState: DayAttendance,
  group: string,
  people: string[],
): DayAttendance {
  const next: DayAttendance = {};
  for (const name of people) {
    const key = personKey(group, name);
    if (dayState[key]) next[key] = dayState[key];
  }
  return next;
}

function countGroup(attendance: DayAttendance, group: string, people: string[]) {
  let present = 0;
  let absent = 0;
  for (const name of people) {
    const status = attendance[personKey(group, name)];
    if (status === "present") present += 1;
    if (status === "absent") absent += 1;
  }
  return {
    present,
    absent,
    unmarked: Math.max(people.length - present - absent, 0),
    total: people.length,
  };
}

function purgePersonKeys(
  prev: AttendanceState,
  match: (key: string) => boolean,
): AttendanceState {
  const next: AttendanceState = {};
  for (const [date, day] of Object.entries(prev)) {
    const copy: DayAttendance = {};
    for (const [key, value] of Object.entries(day)) {
      if (!match(key)) copy[key] = value;
    }
    next[date] = copy;
  }
  return next;
}

export function AttendanceLedger() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(todayISODate);
  const [state, setState] = useState<AttendanceState>({});
  const [roster, setRoster] = useState<Roster>(DEFAULT_ROSTER);
  const [submissions, setSubmissions] = useState<SubmissionsState>({});
  const [notes, setNotes] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [newLeaderName, setNewLeaderName] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedState = readJson<AttendanceState>(ATTENDANCE_STORAGE_KEY, {});
    const savedRoster = readJson<Roster>(ROSTER_STORAGE_KEY, DEFAULT_ROSTER);
    const savedSubs = readJson<SubmissionsState>(SUBMISSIONS_STORAGE_KEY, {});
    setState(savedState);
    setRoster(savedRoster);
    setSubmissions(savedSubs);

    const params = new URLSearchParams(window.location.search);
    const leader = params.get("leader") || params.get("g");
    if (leader) {
      const group = findGroupBySlug(savedRoster, leader);
      if (group) {
        setActiveGroup(group);
        setView("leader");
        const key = submissionKey(group, todayISODate());
        setNotes(savedSubs[key]?.notes || "");
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
  }, [roster, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  }, [submissions, ready]);

  const dayState = state[currentDate] || {};
  const activePeople = activeGroup ? roster[activeGroup] || [] : [];
  const activeKey =
    activeGroup && currentDate ? submissionKey(activeGroup, currentDate) : null;
  const activeSubmission =
    activeKey && submissions[activeKey]
      ? submissions[activeKey]
      : activeGroup
        ? emptySubmission(
            activeGroup,
            currentDate,
            groupAttendance(dayState, activeGroup, activePeople),
          )
        : null;

  const totalMembers = useMemo(() => countRoster(roster), [roster]);
  const analytics = useMemo(
    () => buildAnalytics(roster, state, submissions, currentDate),
    [roster, state, submissions, currentDate],
  );

  const leaderCounts = useMemo(() => {
    if (!activeGroup) return null;
    return countGroup(dayState, activeGroup, activePeople);
  }, [activeGroup, activePeople, dayState]);

  function flash(message: string) {
    setStatusMsg(message);
    window.setTimeout(() => setStatusMsg(""), 2800);
  }

  function openLeader(group: string) {
    setActiveGroup(group);
    setView("leader");
    const key = submissionKey(group, currentDate);
    setNotes(submissions[key]?.notes || "");
    const url = new URL(window.location.href);
    url.searchParams.set("leader", leaderSlug(group));
    window.history.replaceState({}, "", url.toString());
  }

  function goHome() {
    setView("home");
    setActiveGroup(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("leader");
    url.searchParams.delete("g");
    window.history.replaceState({}, "", url.toString());
  }

  function setStatus(group: string, name: string, value: AttendanceStatus) {
    const key = personKey(group, name);
    setState((prev) => {
      const day = { ...(prev[currentDate] || {}) };
      if (day[key] === value) delete day[key];
      else day[key] = value;
      return { ...prev, [currentDate]: day };
    });
  }

  function markGroupPresent(group: string) {
    setState((prev) => {
      const day = { ...(prev[currentDate] || {}) };
      for (const name of roster[group] || []) {
        day[personKey(group, name)] = "present";
      }
      return { ...prev, [currentDate]: day };
    });
    flash("Marked group present");
  }

  function addLeader() {
    const group = formatGroupName(newLeaderName);
    if (!group) {
      flash("Enter a leader name");
      return;
    }
    if (roster[group] || Object.keys(roster).some((g) => g.toLowerCase() === group.toLowerCase())) {
      flash("That leader already exists");
      return;
    }
    setRoster((prev) => ({ ...prev, [group]: [] }));
    setNewLeaderName("");
    flash(`Added ${leaderLabel(group)}`);
  }

  function removeLeader(group: string) {
    if (!window.confirm(`Remove ${leaderLabel(group)} and their members?`)) return;
    setRoster((prev) => {
      const next = { ...prev };
      delete next[group];
      return next;
    });
    setState((prev) => purgePersonKeys(prev, (key) => key.startsWith(`${group}|`)));
    setSubmissions((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${group}|`)) delete next[key];
      }
      return next;
    });
    if (activeGroup === group) goHome();
    flash("Leader removed");
  }

  function addPerson(group: string) {
    const name = (draftNames[group] || "").trim();
    if (!name) return;
    setRoster((prev) => {
      const people = prev[group] || [];
      if (people.some((p) => p.toLowerCase() === name.toLowerCase())) return prev;
      return { ...prev, [group]: [...people, name] };
    });
    setDraftNames((prev) => ({ ...prev, [group]: "" }));
    flash(`Added ${name}`);
  }

  function removePerson(group: string, name: string) {
    if (!window.confirm(`Remove ${name} from ${leaderLabel(group)}?`)) return;
    const key = personKey(group, name);
    setRoster((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((person) => person !== name),
    }));
    setState((prev) => purgePersonKeys(prev, (k) => k === key));
    flash(`Removed ${name}`);
  }

  async function addImages(files: FileList | null) {
    if (!activeGroup || !files?.length) return;
    const key = submissionKey(activeGroup, currentDate);
    const current =
      submissions[key] ||
      emptySubmission(
        activeGroup,
        currentDate,
        groupAttendance(dayState, activeGroup, activePeople),
      );
    const remaining = MAX_IMAGES_PER_SUBMISSION - current.images.length;
    if (remaining <= 0) {
      flash(`Max ${MAX_IMAGES_PER_SUBMISSION} photos per week`);
      return;
    }

    setUploading(true);
    try {
      const selected = Array.from(files).slice(0, remaining);
      const compressed = await Promise.all(
        selected.map((file) => compressImageFile(file)),
      );
      setSubmissions((prev) => ({
        ...prev,
        [key]: {
          ...current,
          attendance: groupAttendance(dayState, activeGroup, activePeople),
          notes,
          images: [...current.images, ...compressed],
          submittedAt: current.submittedAt,
        },
      }));
      flash(
        compressed.length === 1
          ? "Photo added"
          : `${compressed.length} photos added`,
      );
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not add photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function removeImage(imageId: string) {
    if (!activeGroup) return;
    const key = submissionKey(activeGroup, currentDate);
    setSubmissions((prev) => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          ...current,
          images: current.images.filter((image) => image.id !== imageId),
        },
      };
    });
  }

  function submitWeek() {
    if (!activeGroup) return;
    const key = submissionKey(activeGroup, currentDate);
    const attendance = groupAttendance(dayState, activeGroup, activePeople);
    const images = submissions[key]?.images || [];
    const next: WeekSubmission = {
      group: activeGroup,
      date: currentDate,
      attendance,
      images,
      notes: notes.trim(),
      submittedAt: new Date().toISOString(),
    };
    setSubmissions((prev) => ({ ...prev, [key]: next }));
    flash("Weekly submission saved");
  }

  function onDateChange(value: string) {
    setCurrentDate(value);
    if (activeGroup) {
      const key = submissionKey(activeGroup, value);
      setNotes(submissions[key]?.notes || "");
    }
  }

  if (!ready) {
    return (
      <div className="attendance-app">
        <header>
          <div className="header-inner">
            <h1>
              Attendance <span>Ledger</span>
            </h1>
          </div>
        </header>
        <div className="status-msg">Loading…</div>
      </div>
    );
  }

  if (view === "dashboard") {
    const week = analytics.thisWeek;
    return (
      <div className="attendance-app">
        <header>
          <div className="header-inner">
            <div>
              <button type="button" className="back-link" onClick={goHome}>
                ← Leaders
              </button>
              <h1>
                Attendance <span>Dashboard</span>
              </h1>
            </div>
            <div className="date-row">
              <label htmlFor="dashDate">Week of</label>
              <input
                id="dashDate"
                type="date"
                value={currentDate}
                onChange={(event) => setCurrentDate(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="stat-strip">
          <div className="stat-card highlight">
            <span className="stat-label">Total members</span>
            <strong>{analytics.totalMembers}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Leaders</span>
            <strong>{analytics.totalLeaders}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Present this week</span>
            <strong>{week.present}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Attendance rate</span>
            <strong>{week.rate}%</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg rate (recent)</span>
            <strong>{analytics.averageRate}%</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Submissions</span>
            <strong>
              {week.submittedGroups}/{week.totalGroups}
            </strong>
          </div>
        </div>

        <main>
          <section className="group">
            <div className="group-head static">
              <h2>By leader this week</h2>
            </div>
            <div className="group-body">
              {analytics.byGroup.map((row) => (
                <div className="analytics-row" key={row.group}>
                  <div className="analytics-row-main">
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => openLeader(row.group)}
                    >
                      {row.label}
                    </button>
                    <span className="muted">
                      {row.members} members · {row.present} present · {row.absent}{" "}
                      absent
                      {row.submitted ? " · submitted" : ""}
                      {row.photos ? ` · ${row.photos} photos` : ""}
                    </span>
                  </div>
                  <div className="rate-bar" aria-label={`${row.rate}%`}>
                    <span style={{ width: `${row.rate}%` }} />
                    <em>{row.rate}%</em>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="group">
            <div className="group-head static">
              <h2>Recent weeks</h2>
            </div>
            <div className="group-body">
              {analytics.recentWeeks.map((weekRow) => (
                <div className="analytics-row" key={weekRow.date}>
                  <div className="analytics-row-main">
                    <strong>{weekRow.date}</strong>
                    <span className="muted">
                      {weekRow.present} present · {weekRow.absent} absent ·{" "}
                      {weekRow.unmarked} unmarked · {weekRow.submittedGroups}/
                      {weekRow.totalGroups} submitted
                    </span>
                  </div>
                  <div className="rate-bar">
                    <span style={{ width: `${weekRow.rate}%` }} />
                    <em>{weekRow.rate}%</em>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === "home") {
    return (
      <div className="attendance-app">
        <header>
          <div className="header-inner">
            <h1>
              Attendance <span>Ledger</span>
            </h1>
            <div className="date-row">
              <label htmlFor="weekDate">Week of</label>
              <input
                id="weekDate"
                type="date"
                value={currentDate}
                onChange={(event) => setCurrentDate(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="total-banner">
          <div>
            <span className="total-label">Total members</span>
            <strong className="total-number">{totalMembers}</strong>
          </div>
          <div className="total-meta">
            {Object.keys(roster).length} leaders · week of {currentDate}
          </div>
        </div>

        <div className="hero-copy">
          <h2>Who is submitting this week?</h2>
          <p>
            Each leader opens their group, marks attendance, adds photos, and
            submits for the week.
          </p>
        </div>

        <div className="actions">
          <button type="button" onClick={() => setView("dashboard")}>
            Analytics dashboard
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setView("overview")}
          >
            View all groups
          </button>
        </div>
        <div className="status-msg" aria-live="polite">
          {statusMsg || "Leaders can bookmark their personal link, e.g. ?leader=aliye"}
        </div>

        <main className="leader-grid">
          {Object.entries(roster).map(([group, people]) => {
            const key = submissionKey(group, currentDate);
            const submitted = Boolean(submissions[key]?.submittedAt);
            const photoCount = submissions[key]?.images.length || 0;
            return (
              <div
                key={group}
                className={`leader-card${submitted ? " submitted" : ""}`}
              >
                <button
                  type="button"
                  className="leader-card-main"
                  onClick={() => openLeader(group)}
                >
                  <span className="leader-name">{leaderLabel(group)}</span>
                  <span className="leader-meta">
                    {people.length} people
                    {photoCount > 0
                      ? ` · ${photoCount} photo${photoCount === 1 ? "" : "s"}`
                      : ""}
                  </span>
                  <span className={`leader-status${submitted ? " on" : ""}`}>
                    {submitted ? "Submitted" : "Tap to submit"}
                  </span>
                </button>
                <button
                  type="button"
                  className="leader-remove"
                  onClick={() => removeLeader(group)}
                >
                  Remove leader
                </button>
              </div>
            );
          })}
        </main>

        <section className="manage-panel">
          <h3>Add a leader</h3>
          <div className="add-row">
            <input
              type="text"
              placeholder="Leader name…"
              value={newLeaderName}
              onChange={(event) => setNewLeaderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLeader();
                }
              }}
            />
            <button type="button" onClick={addLeader}>
              Add leader
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (view === "leader" && activeGroup && leaderCounts && activeSubmission) {
    const images = submissions[activeKey!]?.images || [];
    const submittedAt = submissions[activeKey!]?.submittedAt;

    return (
      <div className="attendance-app">
        <header>
          <div className="header-inner">
            <div>
              <button type="button" className="back-link" onClick={goHome}>
                ← All leaders
              </button>
              <h1>
                {leaderLabel(activeGroup)} <span>Group</span>
              </h1>
            </div>
            <div className="date-row">
              <label htmlFor="leaderDate">Week of</label>
              <input
                id="leaderDate"
                type="date"
                value={currentDate}
                onChange={(event) => onDateChange(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="summary-bar">
          <div>
            Members: <b>{leaderCounts.total}</b>
          </div>
          <div>
            Present: <b>{leaderCounts.present}</b>
          </div>
          <div>
            Absent: <b>{leaderCounts.absent}</b>
          </div>
          <div>
            Not marked: <b>{leaderCounts.unmarked}</b>
          </div>
          <div>
            Photos: <b>{images.length}</b>
          </div>
        </div>

        <div className="actions">
          <button type="button" onClick={submitWeek}>
            {submittedAt ? "Update submission" : "Submit this week"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => markGroupPresent(activeGroup)}
          >
            Mark all present
          </button>
          <button
            type="button"
            className="secondary danger"
            onClick={() => removeLeader(activeGroup)}
          >
            Remove leader
          </button>
        </div>
        <div className="status-msg" aria-live="polite">
          {statusMsg ||
            (submittedAt
              ? `Last submitted ${new Date(submittedAt).toLocaleString()}`
              : "Mark attendance, manage members, add photos, then submit.")}
        </div>

        <main>
          <section className="group">
            <div className="group-head static">
              <h2>Members & attendance</h2>
              <span className="group-count">{activePeople.length}</span>
            </div>
            <div className="group-body">
              {activePeople.map((name) => {
                const key = personKey(activeGroup, name);
                const current = dayState[key];
                return (
                  <div className="person-row" key={key}>
                    <span className="person-name">{name}</span>
                    <div className="person-actions">
                      <span className="toggle-group">
                        <button
                          type="button"
                          className={`toggle-btn present${current === "present" ? " active" : ""}`}
                          onClick={() => setStatus(activeGroup, name, "present")}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn absent${current === "absent" ? " active" : ""}`}
                          onClick={() => setStatus(activeGroup, name, "absent")}
                        >
                          Absent
                        </button>
                      </span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removePerson(activeGroup, name)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="add-row">
                <input
                  type="text"
                  placeholder="Add a member…"
                  value={draftNames[activeGroup] || ""}
                  onChange={(event) =>
                    setDraftNames((prev) => ({
                      ...prev,
                      [activeGroup]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addPerson(activeGroup);
                    }
                  }}
                />
                <button type="button" onClick={() => addPerson(activeGroup)}>
                  Add member
                </button>
              </div>
            </div>
          </section>

          <section className="group photo-section">
            <div className="group-head static">
              <h2>Weekly photos</h2>
              <span className="group-count">
                {images.length}/{MAX_IMAGES_PER_SUBMISSION}
              </span>
            </div>
            <div className="group-body photo-body">
              <p className="photo-hint">
                Add pictures from this week’s gathering (up to{" "}
                {MAX_IMAGES_PER_SUBMISSION}).
              </p>
              <div className="photo-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={
                    uploading || images.length >= MAX_IMAGES_PER_SUBMISSION
                  }
                  onClick={() => cameraRef.current?.click()}
                >
                  Take photo
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={
                    uploading || images.length >= MAX_IMAGES_PER_SUBMISSION
                  }
                  onClick={() => fileRef.current?.click()}
                >
                  Upload images
                </button>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(event) => addImages(event.target.files)}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => addImages(event.target.files)}
                />
              </div>

              {images.length > 0 ? (
                <div className="photo-grid">
                  {images.map((image) => (
                    <figure key={image.id} className="photo-tile">
                      <img src={image.dataUrl} alt={image.name} />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removeImage(image.id)}
                      >
                        Remove
                      </button>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="photo-empty">No photos yet for this week.</p>
              )}
            </div>
          </section>

          <section className="group">
            <div className="group-head static">
              <h2>Notes</h2>
            </div>
            <div className="group-body">
              <textarea
                className="notes-input"
                rows={3}
                placeholder="Optional notes for this week…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </section>

          <div className="actions bottom-actions">
            <button type="button" onClick={submitWeek}>
              {submittedAt ? "Update submission" : "Submit this week"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="attendance-app">
      <header>
        <div className="header-inner">
          <div>
            <button type="button" className="back-link" onClick={goHome}>
              ← Leaders
            </button>
            <h1>
              All <span>Groups</span>
            </h1>
          </div>
          <div className="date-row">
            <label htmlFor="overviewDate">Week of</label>
            <input
              id="overviewDate"
              type="date"
              value={currentDate}
              onChange={(event) => setCurrentDate(event.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="total-banner compact">
        <div>
          <span className="total-label">Total members</span>
          <strong className="total-number">{totalMembers}</strong>
        </div>
      </div>

      <main>
        {Object.entries(roster).map(([group, people]) => {
          const counts = countGroup(dayState, group, people);
          const key = submissionKey(group, currentDate);
          const sub = submissions[key];
          return (
            <section key={group} className="group">
              <button
                type="button"
                className="group-head"
                onClick={() => openLeader(group)}
              >
                <h2>
                  {group}
                  {sub?.submittedAt ? (
                    <span className="pill submitted-pill">Submitted</span>
                  ) : null}
                </h2>
                <span className="group-count">
                  {counts.present}/{counts.total} · {sub?.images.length || 0}{" "}
                  photos
                </span>
              </button>
              {sub?.images?.length ? (
                <div className="group-body">
                  <div className="photo-grid compact">
                    {sub.images.map((image) => (
                      <figure key={image.id} className="photo-tile">
                        <img src={image.dataUrl} alt={image.name} />
                      </figure>
                    ))}
                  </div>
                  {sub.notes ? <p className="notes-preview">{sub.notes}</p> : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </main>
    </div>
  );
}
