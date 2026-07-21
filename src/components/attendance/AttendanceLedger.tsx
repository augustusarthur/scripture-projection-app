"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ATTENDANCE_STORAGE_KEY,
  AttendanceState,
  AttendanceStatus,
  DEFAULT_ROSTER,
  ROSTER_STORAGE_KEY,
  Roster,
  countRoster,
  personKey,
  todayISODate,
} from "@/lib/attendance-roster";
import "./attendance.css";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AttendanceLedger() {
  const [ready, setReady] = useState(false);
  const [currentDate, setCurrentDate] = useState(todayISODate);
  const [state, setState] = useState<AttendanceState>({});
  const [roster, setRoster] = useState<Roster>(DEFAULT_ROSTER);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    setState(readJson<AttendanceState>(ATTENDANCE_STORAGE_KEY, {}));
    setRoster(readJson<Roster>(ROSTER_STORAGE_KEY, DEFAULT_ROSTER));
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

  const dayState = state[currentDate] || {};
  const total = useMemo(() => countRoster(roster), [roster]);

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    for (const value of Object.values(dayState)) {
      if (value === "present") present += 1;
      if (value === "absent") absent += 1;
    }
    return {
      present,
      absent,
      unmarked: Math.max(total - present - absent, 0),
      total,
    };
  }, [dayState, total]);

  function flash(message: string) {
    setStatusMsg(message);
    window.setTimeout(() => setStatusMsg(""), 2500);
  }

  function setStatus(key: string, value: AttendanceStatus) {
    setState((prev) => {
      const day = { ...(prev[currentDate] || {}) };
      if (day[key] === value) {
        delete day[key];
      } else {
        day[key] = value;
      }
      return { ...prev, [currentDate]: day };
    });
  }

  function markAllPresent() {
    setState((prev) => {
      const day = { ...(prev[currentDate] || {}) };
      for (const [group, people] of Object.entries(roster)) {
        for (const name of people) {
          day[personKey(group, name)] = "present";
        }
      }
      return { ...prev, [currentDate]: day };
    });
    flash("Marked everyone present");
  }

  function saveAttendance() {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
    flash(`Saved ${new Date().toLocaleTimeString()}`);
  }

  function exportCsv() {
    const rows = [["Group", "Name", "Status"]];
    for (const [group, people] of Object.entries(roster)) {
      for (const name of people) {
        const status = dayState[personKey(group, name)] || "not marked";
        rows.push([group, name, status]);
      }
    }
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-${currentDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function addPerson(group: string) {
    const name = (draftNames[group] || "").trim();
    if (!name) return;
    setRoster((prev) => {
      const people = prev[group] || [];
      if (people.some((p) => p.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return { ...prev, [group]: [...people, name] };
    });
    setDraftNames((prev) => ({ ...prev, [group]: "" }));
  }

  function removePerson(group: string, name: string) {
    const key = personKey(group, name);
    setRoster((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((person) => person !== name),
    }));
    setState((prev) => {
      const next: AttendanceState = {};
      for (const [date, day] of Object.entries(prev)) {
        const copy = { ...day };
        delete copy[key];
        next[date] = copy;
      }
      return next;
    });
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
        <div className="status-msg">Loading roster…</div>
      </div>
    );
  }

  return (
    <div className="attendance-app">
      <header>
        <div className="header-inner">
          <h1>
            Attendance <span>Ledger</span>
          </h1>
          <div className="date-row">
            <label htmlFor="attDate">Date</label>
            <input
              id="attDate"
              type="date"
              value={currentDate}
              onChange={(event) => setCurrentDate(event.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="summary-bar">
        <div>
          Present: <b>{counts.present}</b>
        </div>
        <div>
          Absent: <b>{counts.absent}</b>
        </div>
        <div>
          Not marked: <b>{counts.unmarked}</b>
        </div>
        <div>
          Total roster: <b>{counts.total}</b>
        </div>
      </div>

      <div className="actions">
        <button type="button" onClick={saveAttendance}>
          Save attendance
        </button>
        <button type="button" className="secondary" onClick={markAllPresent}>
          Mark all present
        </button>
        <button type="button" className="secondary" onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div className="status-msg" aria-live="polite">
        {statusMsg || "Attendance saves automatically on this device."}
      </div>

      <main>
        {Object.entries(roster).map(([group, people]) => {
          const isCollapsed = Boolean(collapsed[group]);
          return (
            <section
              key={group}
              className={`group${isCollapsed ? " collapsed" : ""}`}
            >
              <button
                type="button"
                className="group-head"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
                }
                aria-expanded={!isCollapsed}
              >
                <h2>
                  {group} <span className="chevron">▾</span>
                </h2>
                <span className="group-count">{people.length}</span>
              </button>

              <div className="group-body">
                {people.map((name) => {
                  const key = personKey(group, name);
                  const current = dayState[key];
                  return (
                    <div className="person-row" key={key}>
                      <span className="person-name">{name}</span>
                      <div className="person-actions">
                        <span className="toggle-group">
                          <button
                            type="button"
                            className={`toggle-btn present${current === "present" ? " active" : ""}`}
                            onClick={() => setStatus(key, "present")}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`toggle-btn absent${current === "absent" ? " active" : ""}`}
                            onClick={() => setStatus(key, "absent")}
                          >
                            Absent
                          </button>
                        </span>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removePerson(group, name)}
                          aria-label={`Remove ${name}`}
                          title="Remove from roster"
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
                    placeholder="Add a name…"
                    value={draftNames[group] || ""}
                    onChange={(event) =>
                      setDraftNames((prev) => ({
                        ...prev,
                        [group]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addPerson(group);
                      }
                    }}
                  />
                  <button type="button" onClick={() => addPerson(group)}>
                    Add
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
