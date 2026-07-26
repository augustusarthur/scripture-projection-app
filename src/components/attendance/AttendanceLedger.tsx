"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENDANCE_STORAGE_KEY,
  AttendanceState,
  AttendanceStatus,
  DEFAULT_ROSTER,
  DEFAULT_SYNC_ID,
  DayAttendance,
  MAX_IMAGES_PER_SUBMISSION,
  Member,
  ROSTER_STORAGE_KEY,
  Roster,
  SUBMISSIONS_STORAGE_KEY,
  SYNC_ID_STORAGE_KEY,
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
  loadCloudSync,
  memberNames,
  moveMemberInRoster,
  moveMemberToIcu,
  normalizeRoster,
  personKey,
  remapsAttendanceForMove,
  restoreMemberFromIcu,
  saveCloudSync,
  submissionKey,
  todayISODate,
} from "@/lib/attendance-roster";
import "./attendance.css";

type View = "home" | "leader" | "overview" | "dashboard";

type DraftMemberFields = Record<string, { name: string; phone: string }>;

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

function setSyncInUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("sync", id);
  window.history.replaceState({}, "", url.toString());
}

function shareUrl(syncId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("sync", syncId);
  url.searchParams.delete("leader");
  url.searchParams.delete("g");
  return url.toString();
}

export function AttendanceLedger() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(todayISODate);
  const [state, setState] = useState<AttendanceState>({});
  const [roster, setRoster] = useState<Roster>(DEFAULT_ROSTER);
  const [draftRoster, setDraftRoster] = useState<Roster | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncId, setSyncId] = useState(DEFAULT_SYNC_ID);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionsState>({});
  const [notes, setNotes] = useState("");
  const [draftMembers, setDraftMembers] = useState<DraftMemberFields>({});
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const [newLeaderName, setNewLeaderName] = useState("");
  const [newLeaderPhone, setNewLeaderPhone] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const statusTimer = useRef<number | null>(null);

  const activeRoster = editing && draftRoster ? draftRoster : roster;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const params = new URLSearchParams(window.location.search);
      let nextSyncId =
        params.get("sync") ||
        localStorage.getItem(SYNC_ID_STORAGE_KEY) ||
        DEFAULT_SYNC_ID;
      setSyncInUrl(nextSyncId);

      let nextRoster = normalizeRoster(
        readJson<unknown>(ROSTER_STORAGE_KEY, DEFAULT_ROSTER),
      );
      let nextState = readJson<AttendanceState>(ATTENDANCE_STORAGE_KEY, {});
      let nextSubs = readJson<SubmissionsState>(SUBMISSIONS_STORAGE_KEY, {});
      let nextSyncedAt = "";

      const cloud = await loadCloudSync(nextSyncId);
      if (cloud) {
        nextRoster = cloud.roster;
        nextState = cloud.attendance;
        nextSubs = cloud.submissions;
        nextSyncedAt = cloud.updatedAt || "";
      } else {
        try {
          nextSyncId = await saveCloudSync(nextSyncId, {
            roster: nextRoster,
            attendance: nextState,
            submissions: nextSubs,
          });
          nextSyncedAt = new Date().toISOString();
          setSyncInUrl(nextSyncId);
        } catch {
          // Keep local data if cloud seed fails.
        }
      }

      if (cancelled) return;

      setSyncId(nextSyncId);
      setRoster(nextRoster);
      setState(nextState);
      setSubmissions(nextSubs);
      setLastSyncedAt(nextSyncedAt);
      localStorage.setItem(SYNC_ID_STORAGE_KEY, nextSyncId);
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(nextRoster));
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(nextState));
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(nextSubs));

      const leader = params.get("leader") || params.get("g");
      if (leader) {
        const group = findGroupBySlug(nextRoster, leader);
        if (group) {
          setActiveGroup(group);
          setView("leader");
          const key = submissionKey(group, todayISODate());
          setNotes(nextSubs[key]?.notes || "");
        }
      }
      setReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SYNC_ID_STORAGE_KEY, syncId);
  }, [syncId, ready]);

  const dayState = state[currentDate] || {};
  const activeMembers: Member[] = activeGroup
    ? activeRoster[activeGroup]?.members || []
    : [];
  const icuMembers: Member[] = activeGroup
    ? activeRoster[activeGroup]?.icu || []
    : [];
  const activePeople = activeMembers.map((member) => member.name);
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

  const totalMembers = useMemo(() => countRoster(activeRoster), [activeRoster]);
  const analytics = useMemo(
    () => buildAnalytics(activeRoster, state, submissions, currentDate),
    [activeRoster, state, submissions, currentDate],
  );

  const leaderCounts = useMemo(() => {
    if (!activeGroup) return null;
    return countGroup(dayState, activeGroup, activePeople);
  }, [activeGroup, activePeople, dayState]);

  function flash(message: string) {
    setStatusMsg(message);
    if (statusTimer.current) window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatusMsg(""), 2800);
  }

  function persistSyncId(id: string) {
    setSyncId(id);
    setSyncInUrl(id);
    localStorage.setItem(SYNC_ID_STORAGE_KEY, id);
  }

  async function pushCloud(
    nextRoster: Roster,
    nextState: AttendanceState,
    nextSubs: SubmissionsState,
  ) {
    const updatedAt = new Date().toISOString();
    const id = await saveCloudSync(syncId, {
      roster: nextRoster,
      attendance: nextState,
      submissions: nextSubs,
      updatedAt,
    });
    persistSyncId(id);
    setLastSyncedAt(updatedAt);
    return id;
  }

  function enterEdit() {
    setDraftRoster(structuredClone(roster));
    setEditing(true);
    setNewLeaderName("");
    setNewLeaderPhone("");
  }

  function cancelEdit() {
    setDraftRoster(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!draftRoster) return;
    setSaving(true);
    try {
      const next = structuredClone(draftRoster);
      setRoster(next);
      await pushCloud(next, state, submissions);
      setDraftRoster(null);
      setEditing(false);
      flash("Saved for all devices");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function syncNow() {
    setSaving(true);
    try {
      await pushCloud(roster, state, submissions);
      flash("Synced to all devices");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSaving(false);
    }
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
    const people = memberNames(activeRoster[group]);
    setState((prev) => {
      const day = { ...(prev[currentDate] || {}) };
      for (const name of people) {
        day[personKey(group, name)] = "present";
      }
      return { ...prev, [currentDate]: day };
    });
    flash("Marked group present");
  }

  function addLeader() {
    if (!editing || !draftRoster) {
      flash("Turn on Edit mode first");
      return;
    }
    const group = formatGroupName(newLeaderName);
    if (!group) {
      flash("Enter a leader name");
      return;
    }
    if (
      draftRoster[group] ||
      Object.keys(draftRoster).some((g) => g.toLowerCase() === group.toLowerCase())
    ) {
      flash("That leader already exists");
      return;
    }
    setDraftRoster((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [group]: { phone: newLeaderPhone.trim(), members: [], icu: [] },
      };
    });
    setNewLeaderName("");
    setNewLeaderPhone("");
    flash("Leader added — tap Save to sync");
  }

  function removeLeader(group: string) {
    if (!editing || !draftRoster) {
      flash("Turn on Edit mode first");
      return;
    }
    if (!window.confirm(`Remove ${leaderLabel(group)} and their members?`)) return;
    setDraftRoster((prev) => {
      if (!prev) return prev;
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
    flash("Leader removed — tap Save to sync");
  }

  function setLeaderPhone(group: string, phone: string) {
    if (!editing || !draftRoster?.[group]) return;
    setDraftRoster((prev) => {
      if (!prev?.[group]) return prev;
      return {
        ...prev,
        [group]: { ...prev[group], phone },
      };
    });
  }

  function addPerson(group: string) {
    if (!editing || !draftRoster) {
      flash("Turn on Edit mode first");
      return;
    }
    const draft = draftMembers[group] || { name: "", phone: "" };
    const name = draft.name.trim();
    if (!name) return;
    const members = draftRoster[group]?.members || [];
    if (members.some((member) => member.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setDraftRoster((prev) => {
      if (!prev?.[group]) return prev;
      return {
        ...prev,
        [group]: {
          ...prev[group],
          members: [
            ...prev[group].members,
            { name, phone: draft.phone.trim() },
          ],
        },
      };
    });
    setDraftMembers((prev) => ({ ...prev, [group]: { name: "", phone: "" } }));
    flash("Member added — tap Save to sync");
  }

  function removePerson(group: string, name: string) {
    if (!editing || !draftRoster) {
      flash("Turn on Edit mode first");
      return;
    }
    if (!window.confirm(`Remove ${name}?`)) return;
    const key = personKey(group, name);
    setDraftRoster((prev) => {
      if (!prev?.[group]) return prev;
      return {
        ...prev,
        [group]: {
          ...prev[group],
          members: prev[group].members.filter((member) => member.name !== name),
        },
      };
    });
    setState((prev) => purgePersonKeys(prev, (k) => k === key));
    flash("Member removed — tap Save to sync");
  }

  function movePerson(fromGroup: string, name: string, toGroup: string) {
    if (!editing || !draftRoster) {
      flash("Turn on Edit mode first");
      return;
    }
    if (!toGroup || toGroup === fromGroup) {
      flash("Choose a different leader");
      return;
    }
    const moved = moveMemberInRoster(draftRoster, fromGroup, toGroup, name);
    if (!moved) {
      flash("Could not move — already in that group?");
      return;
    }
    setDraftRoster(moved);
    setState((prev) =>
      remapsAttendanceForMove(prev, fromGroup, toGroup, name),
    );
    setMoveTargets((prev) => {
      const copy = { ...prev };
      delete copy[`${fromGroup}|${name}`];
      return copy;
    });
    flash(`Moved ${name} — tap Save to sync`);
  }

  async function applyRosterChange(
    next: Roster,
    successMessage: string,
    pendingEditMessage: string,
  ) {
    if (editing) {
      setDraftRoster(next);
      flash(pendingEditMessage);
      return;
    }
    setRoster(next);
    try {
      const savedId = await saveCloudSync(syncId, {
        roster: next,
        attendance: state,
        submissions,
      });
      setSyncId(savedId);
      setSyncInUrl(savedId);
      flash(successMessage);
    } catch {
      flash(`${successMessage} (saved on this phone — Sync failed)`);
    }
  }

  async function sendToIcu(group: string, name: string) {
    const source = editing && draftRoster ? draftRoster : roster;
    const next = moveMemberToIcu(source, group, name);
    if (!next) {
      flash("Could not move to ICU");
      return;
    }
    await applyRosterChange(
      next,
      `${name} moved to ICU`,
      `${name} moved to ICU — tap Save to sync`,
    );
  }

  async function restoreFromIcu(group: string, name: string) {
    const source = editing && draftRoster ? draftRoster : roster;
    const next = restoreMemberFromIcu(source, group, name);
    if (!next) {
      flash("Could not restore from ICU");
      return;
    }
    await applyRosterChange(
      next,
      `${name} restored to active list`,
      `${name} restored — tap Save to sync`,
    );
  }

  function setMemberPhone(group: string, name: string, phone: string) {
    if (!editing || !draftRoster) return;
    setDraftRoster((prev) => {
      if (!prev?.[group]) return prev;
      return {
        ...prev,
        [group]: {
          ...prev[group],
          members: prev[group].members.map((member) =>
            member.name === name ? { ...member, phone } : member,
          ),
        },
      };
    });
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

  async function submitWeek() {
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
    const nextSubs = { ...submissions, [key]: next };
    setSubmissions(nextSubs);
    try {
      await pushCloud(roster, state, nextSubs);
      flash("Weekly submission saved for all devices");
    } catch {
      flash("Saved on this phone — Sync failed, tap Sync later");
    }
  }

  function onDateChange(value: string) {
    setCurrentDate(value);
    if (activeGroup) {
      const key = submissionKey(activeGroup, value);
      setNotes(submissions[key]?.notes || "");
    }
  }

  function modeBanner() {
    if (editing) {
      return (
        <div className="mode-banner">
          Edit mode — change leaders/members/phones, then tap <b>Save</b> so every
          device sees the update.
        </div>
      );
    }
    return (
      <div className="mode-banner view">
        View mode — leaders can submit. Tap <b>Edit</b> to change the roster.
      </div>
    );
  }

  function editActions() {
    if (editing) {
      return (
        <>
          <button type="button" disabled={saving} onClick={() => void saveEdit()}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className="secondary" onClick={cancelEdit}>
            Cancel
          </button>
        </>
      );
    }
    return (
      <>
        <button type="button" onClick={enterEdit}>
          Edit
        </button>
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => void syncNow()}
        >
          {saving ? "Syncing…" : "Sync"}
        </button>
      </>
    );
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
        <div className="status-msg">Loading shared church data…</div>
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
            {Object.keys(activeRoster).length} leaders · week of {currentDate}
          </div>
        </div>

        <div className="hero-copy">
          <h2>Who is submitting this week?</h2>
          <p>
            Pick your name, mark attendance, add photos, and submit. Use Edit +
            Save to update leaders for every device.
          </p>
        </div>

        {modeBanner()}

        <div className="actions">
          {editActions()}
          {!editing ? (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setView("dashboard")}
              >
                Analytics
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setView("overview")}
              >
                All groups
              </button>
            </>
          ) : null}
        </div>
        <div className="status-msg" aria-live="polite">
          {statusMsg ||
            (lastSyncedAt
              ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
              : "Shared across devices when you Save or Sync.")}
        </div>
        <div className="share-box">
          Share this church link with all leaders:
          <br />
          <code>{shareUrl(syncId)}</code>
        </div>

        <main className="leader-grid">
          {Object.entries(activeRoster).map(([group, record]) => {
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
                  {record.phone ? (
                    <span className="phone-line">☎ {record.phone}</span>
                  ) : null}
                  <span className="leader-meta">
                    {(record.members || []).length} active
                    {(record.icu || []).length
                      ? ` · ${record.icu.length} ICU`
                      : ""}
                    {photoCount > 0
                      ? ` · ${photoCount} photo${photoCount === 1 ? "" : "s"}`
                      : ""}
                  </span>
                  <span className={`leader-status${submitted ? " on" : ""}`}>
                    {submitted ? "Submitted" : "Tap to submit"}
                  </span>
                </button>
                {editing ? (
                  <button
                    type="button"
                    className="leader-remove"
                    onClick={() => removeLeader(group)}
                  >
                    Remove leader
                  </button>
                ) : null}
              </div>
            );
          })}
        </main>

        {editing ? (
          <section className="manage-panel">
            <h3>Add a leader</h3>
            <div className="field-row">
              <input
                type="text"
                placeholder="Leader name"
                value={newLeaderName}
                onChange={(event) => setNewLeaderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addLeader();
                  }
                }}
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={newLeaderPhone}
                onChange={(event) => setNewLeaderPhone(event.target.value)}
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
        ) : null}
      </div>
    );
  }

  if (view === "leader" && activeGroup && leaderCounts && activeSubmission) {
    const images = submissions[activeKey!]?.images || [];
    const submittedAt = submissions[activeKey!]?.submittedAt;
    const leaderPhone = activeRoster[activeGroup]?.phone || "";
    const memberDraft = draftMembers[activeGroup] || { name: "", phone: "" };

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

        {modeBanner()}

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
          <button type="button" onClick={() => void submitWeek()}>
            {submittedAt ? "Update submission" : "Submit this week"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => markGroupPresent(activeGroup)}
          >
            Mark all present
          </button>
          {editActions()}
          {editing ? (
            <button
              type="button"
              className="secondary danger"
              onClick={() => removeLeader(activeGroup)}
            >
              Remove leader
            </button>
          ) : null}
        </div>
        <div className="status-msg" aria-live="polite">
          {statusMsg ||
            (submittedAt
              ? `Last submitted ${new Date(submittedAt).toLocaleString()}`
              : "Mark attendance, add photos, then submit.")}
        </div>

        <main>
          <section className="group">
            <div className="group-head static">
              <h2>Leader phone</h2>
            </div>
            <div className="group-body phone-body">
              {editing ? (
                <input
                  className="phone-input"
                  type="tel"
                  placeholder="Leader phone number"
                  value={leaderPhone}
                  onChange={(event) =>
                    setLeaderPhone(activeGroup, event.target.value)
                  }
                />
              ) : (
                <span className="phone-line">
                  {leaderPhone ? `☎ ${leaderPhone}` : "No phone saved"}
                </span>
              )}
            </div>
          </section>

          <section className="group">
            <div className="group-head static">
              <h2>Members & attendance</h2>
              <span className="group-count">{activeMembers.length}</span>
            </div>
            <div className="group-body">
              {activeMembers.map((member) => {
                const key = personKey(activeGroup, member.name);
                const current = dayState[key];
                return (
                  <div className="person-row" key={key}>
                    <div className="person-main">
                      <span className="person-name">{member.name}</span>
                      {editing ? (
                        <input
                          className="phone-input"
                          type="tel"
                          placeholder="Phone"
                          value={member.phone || ""}
                          onChange={(event) =>
                            setMemberPhone(
                              activeGroup,
                              member.name,
                              event.target.value,
                            )
                          }
                        />
                      ) : member.phone ? (
                        <span className="person-phone">☎ {member.phone}</span>
                      ) : null}
                    </div>
                    <div className="person-actions">
                      <span className="toggle-group">
                        <button
                          type="button"
                          className={`toggle-btn present${current === "present" ? " active" : ""}`}
                          onClick={() =>
                            setStatus(activeGroup, member.name, "present")
                          }
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn absent${current === "absent" ? " active" : ""}`}
                          onClick={() =>
                            setStatus(activeGroup, member.name, "absent")
                          }
                        >
                          Absent
                        </button>
                      </span>
                      <button
                        type="button"
                        className="icu-btn"
                        onClick={() => sendToIcu(activeGroup, member.name)}
                      >
                        To ICU
                      </button>
                      {editing ? (
                        <>
                          <label className="move-control">
                            <span className="sr-only">Move {member.name}</span>
                            <select
                              value={
                                moveTargets[`${activeGroup}|${member.name}`] ||
                                ""
                              }
                              onChange={(event) =>
                                setMoveTargets((prev) => ({
                                  ...prev,
                                  [`${activeGroup}|${member.name}`]:
                                    event.target.value,
                                }))
                              }
                            >
                              <option value="">Move to…</option>
                              {Object.keys(activeRoster)
                                .filter((group) => group !== activeGroup)
                                .map((group) => (
                                  <option key={group} value={group}>
                                    {leaderLabel(group)}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              className="secondary move-btn"
                              onClick={() =>
                                movePerson(
                                  activeGroup,
                                  member.name,
                                  moveTargets[
                                    `${activeGroup}|${member.name}`
                                  ] || "",
                                )
                              }
                            >
                              Move
                            </button>
                          </label>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() =>
                              removePerson(activeGroup, member.name)
                            }
                          >
                            Remove
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {editing ? (
                <div className="add-row">
                  <input
                    type="text"
                    placeholder="Member name"
                    value={memberDraft.name}
                    onChange={(event) =>
                      setDraftMembers((prev) => ({
                        ...prev,
                        [activeGroup]: {
                          ...memberDraft,
                          name: event.target.value,
                        },
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addPerson(activeGroup);
                      }
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={memberDraft.phone}
                    onChange={(event) =>
                      setDraftMembers((prev) => ({
                        ...prev,
                        [activeGroup]: {
                          ...memberDraft,
                          phone: event.target.value,
                        },
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
              ) : null}
            </div>
          </section>

          <section className="group icu-section">
            <div className="group-head static">
              <h2>ICU</h2>
              <span className="group-count">{icuMembers.length}</span>
            </div>
            <div className="group-body">
              <p className="photo-hint">
                Move members here when they have been absent for a while. This is
                a manual leader action.
              </p>
              {icuMembers.length === 0 ? (
                <p className="photo-empty">No one in ICU right now.</p>
              ) : (
                icuMembers.map((member) => (
                  <div className="person-row" key={`icu-${member.name}`}>
                    <div className="person-main">
                      <span className="person-name">{member.name}</span>
                      {member.phone ? (
                        <span className="person-phone">☎ {member.phone}</span>
                      ) : null}
                    </div>
                    <div className="person-actions">
                      <button
                        type="button"
                        className="icu-btn restore"
                        onClick={() => restoreFromIcu(activeGroup, member.name)}
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
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
            <button type="button" onClick={() => void submitWeek()}>
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
        {Object.entries(activeRoster).map(([group, record]) => {
          const people = memberNames(record);
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
