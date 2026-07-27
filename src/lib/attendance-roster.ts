export type AttendanceStatus = "present" | "absent";

export type DayAttendance = Record<string, AttendanceStatus>;

export type AttendanceState = Record<string, DayAttendance>;

export type Member = {
  name: string;
  phone: string;
};

export type GroupRecord = {
  phone: string;
  members: Member[];
  /** Members set aside for follow-up after repeated absence */
  icu: Member[];
};

export type Roster = Record<string, GroupRecord>;

export type SubmissionImage = {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: string;
};

export type WeekSubmission = {
  group: string;
  date: string;
  attendance: DayAttendance;
  images: SubmissionImage[];
  notes: string;
  submittedAt: string | null;
};

export type SubmissionsState = Record<string, WeekSubmission>;

export type CloudPayload = {
  version: 2;
  roster: Roster;
  attendance: AttendanceState;
  submissions: SubmissionsState;
  updatedAt: string;
};

function membersFromNames(names: string[]): Member[] {
  return names.map((name) => ({ name, phone: "" }));
}

function groupFromNames(names: string[]): GroupRecord {
  return { phone: "", members: membersFromNames(names), icu: [] };
}

export const DEFAULT_ROSTER: Roster = {
  "Aliye's Group": groupFromNames([
    "Anthony",
    "Heba",
    "Jeremy",
    "Jordan",
    "Josiah",
    "Odera",
    "Patrick",
    "Tessa",
    "Kokou",
    "Kriti",
    "Adrianna",
    "Judith",
  ]),
  "Augustus's Group": groupFromNames([
    "Dieumerci",
    "Ashlee",
    "Brian",
    "Furri",
    "Pastor Glodie",
    "Pressley",
    "Terrence",
    "Israel",
    "Uyi",
    "Aliye",
    "Chancela",
    "Chidi",
    "Diana",
    "Ephraim",
    "Korey",
    "Mama Vivian",
    "Nancy",
    "Shalyne",
  ]),
  "Diana's Group": groupFromNames([
    "Caleb",
    "Dawit",
    "Ian",
    "Kameron",
    "Lady Nikki",
    "Rehema",
  ]),
  "Naa's Group": groupFromNames([
    "Chiche",
    "Kriti",
    "Mac Noble",
    "Mya",
    "Tarmadji",
    "Treasure",
  ]),
  "Shalyne's Group": groupFromNames([
    "Eden M",
    "Morris",
    "Talent",
    "Trishana",
    "Vanessa",
    "Dennis",
    "Brian",
    "Douglas",
    "Maru",
  ]),
  "Felix's Group": groupFromNames([
    "Gerald",
    "Theresa",
    "Jackson",
    "Cisco",
    "Nancy Twum",
    "Jeff",
  ]),
  "Needs a Group": groupFromNames([
    "Lucky",
    "Atrel/Joseph",
    "Dezhon",
    "Johan",
  ]),
};

export const ATTENDANCE_STORAGE_KEY = "church-attendance-state-v2";
export const ROSTER_STORAGE_KEY = "church-attendance-roster-v2";
export const SUBMISSIONS_STORAGE_KEY = "church-attendance-submissions-v2";
export const SYNC_ID_STORAGE_KEY = "church-attendance-sync-id-v1";

/** Shared church cloud record — all devices with this link use the same data */
export const DEFAULT_SYNC_ID = "019fa12a-e208-7876-b8f3-4f51e32a3093";

export const MAX_IMAGES_PER_SUBMISSION = 8;

const SYNC_API = "https://jsonblob.com/api/jsonBlob";

export function personKey(group: string, name: string) {
  return `${group}|${name}`;
}

export function submissionKey(group: string, date: string) {
  return `${group}|${date}`;
}

export function todayISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function memberNames(group: GroupRecord | undefined) {
  return (group?.members || []).map((member) => member.name);
}

export function countRoster(roster: Roster) {
  return Object.values(roster).reduce(
    (sum, group) =>
      sum + (group.members?.length || 0) + (group.icu?.length || 0),
    0,
  );
}

export function countActiveMembers(roster: Roster) {
  return Object.values(roster).reduce(
    (sum, group) => sum + (group.members?.length || 0),
    0,
  );
}

function parseMembers(raw: unknown): Member[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { name: item, phone: "" };
      if (item && typeof item === "object") {
        const member = item as { name?: unknown; phone?: unknown };
        if (typeof member.name === "string" && member.name.trim()) {
          return {
            name: member.name.trim(),
            phone: typeof member.phone === "string" ? member.phone : "",
          };
        }
      }
      return null;
    })
    .filter((item): item is Member => Boolean(item));
}

export function formatGroupName(leaderName: string) {
  const trimmed = leaderName.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (/group$/i.test(trimmed)) return trimmed;
  if (trimmed.toLowerCase().endsWith("s")) return `${trimmed}' Group`;
  return `${trimmed}'s Group`;
}

export function normalizeRoster(raw: unknown): Roster {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_ROSTER);
  const next: Roster = {};
  for (const [group, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      next[group] = {
        phone: "",
        members: parseMembers(value),
        icu: [],
      };
      continue;
    }
    if (value && typeof value === "object") {
      const record = value as {
        phone?: unknown;
        members?: unknown;
        icu?: unknown;
      };
      next[group] = {
        phone: typeof record.phone === "string" ? record.phone : "",
        members: parseMembers(record.members),
        icu: parseMembers(record.icu),
      };
    }
  }
  return Object.keys(next).length ? next : structuredClone(DEFAULT_ROSTER);
}

export type GroupAnalytics = {
  group: string;
  label: string;
  members: number;
  icu: number;
  present: number;
  absent: number;
  unmarked: number;
  rate: number;
  submitted: boolean;
  photos: number;
};

export type WeekAnalytics = {
  date: string;
  present: number;
  absent: number;
  unmarked: number;
  total: number;
  rate: number;
  submittedGroups: number;
  totalGroups: number;
};

export type AttendanceAnalytics = {
  totalMembers: number;
  totalActive: number;
  totalIcu: number;
  totalLeaders: number;
  thisWeek: WeekAnalytics;
  byGroup: GroupAnalytics[];
  recentWeeks: WeekAnalytics[];
  /** Oldest → newest, for trend charts */
  trendWeeks: WeekAnalytics[];
  averageRate: number;
};

function dayTotals(
  roster: Roster,
  day: DayAttendance,
): Omit<WeekAnalytics, "date" | "submittedGroups" | "totalGroups"> {
  let present = 0;
  let absent = 0;
  let total = 0;
  for (const [group, record] of Object.entries(roster)) {
    for (const member of record.members || []) {
      total += 1;
      const status = day[personKey(group, member.name)];
      if (status === "present") present += 1;
      if (status === "absent") absent += 1;
    }
  }
  const unmarked = Math.max(total - present - absent, 0);
  const marked = present + absent;
  return {
    present,
    absent,
    unmarked,
    total,
    rate: marked ? Math.round((present / marked) * 100) : 0,
  };
}

export function leaderSlug(group: string) {
  return group
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function leaderLabel(group: string) {
  if (group === "Needs a Group") return "Needs a Group";
  return group.replace(/'s Group$/i, "");
}

export function findGroupBySlug(roster: Roster, slug: string) {
  const normalized = slug.toLowerCase();
  return Object.keys(roster).find((group) => leaderSlug(group) === normalized);
}

function findMemberInGroup(group: GroupRecord, memberName: string) {
  const inActive = group.members.find((item) => item.name === memberName);
  if (inActive) return { member: inActive, from: "members" as const };
  const inIcu = (group.icu || []).find((item) => item.name === memberName);
  if (inIcu) return { member: inIcu, from: "icu" as const };
  return null;
}

/** Move a member between groups (active list). Returns null if invalid. */
export function moveMemberInRoster(
  roster: Roster,
  fromGroup: string,
  toGroup: string,
  memberName: string,
): Roster | null {
  if (!fromGroup || !toGroup || fromGroup === toGroup) return null;
  const from = roster[fromGroup];
  const to = roster[toGroup];
  if (!from || !to) return null;
  const found = findMemberInGroup(from, memberName);
  if (!found) return null;
  if (
    to.members.some(
      (item) => item.name.toLowerCase() === memberName.toLowerCase(),
    ) ||
    (to.icu || []).some(
      (item) => item.name.toLowerCase() === memberName.toLowerCase(),
    )
  ) {
    return null;
  }
  return {
    ...roster,
    [fromGroup]: {
      ...from,
      members:
        found.from === "members"
          ? from.members.filter((item) => item.name !== memberName)
          : from.members,
      icu:
        found.from === "icu"
          ? (from.icu || []).filter((item) => item.name !== memberName)
          : from.icu || [],
    },
    [toGroup]: {
      ...to,
      members: [...to.members, { ...found.member }],
      icu: to.icu || [],
    },
  };
}

/** Leader action: move an active member into this group's ICU section. */
export function moveMemberToIcu(
  roster: Roster,
  groupName: string,
  memberName: string,
): Roster | null {
  const group = roster[groupName];
  if (!group) return null;
  const member = group.members.find((item) => item.name === memberName);
  if (!member) return null;
  if (
    (group.icu || []).some(
      (item) => item.name.toLowerCase() === memberName.toLowerCase(),
    )
  ) {
    return null;
  }
  return {
    ...roster,
    [groupName]: {
      ...group,
      members: group.members.filter((item) => item.name !== memberName),
      icu: [...(group.icu || []), { ...member }],
    },
  };
}

/** Leader action: restore a member from ICU back to the active list. */
export function restoreMemberFromIcu(
  roster: Roster,
  groupName: string,
  memberName: string,
): Roster | null {
  const group = roster[groupName];
  if (!group) return null;
  const member = (group.icu || []).find((item) => item.name === memberName);
  if (!member) return null;
  if (
    group.members.some(
      (item) => item.name.toLowerCase() === memberName.toLowerCase(),
    )
  ) {
    return null;
  }
  return {
    ...roster,
    [groupName]: {
      ...group,
      icu: (group.icu || []).filter((item) => item.name !== memberName),
      members: [...group.members, { ...member }],
    },
  };
}

/** Remap attendance keys after a member moves groups. */
export function remapsAttendanceForMove(
  state: AttendanceState,
  fromGroup: string,
  toGroup: string,
  memberName: string,
): AttendanceState {
  const fromKey = personKey(fromGroup, memberName);
  const toKey = personKey(toGroup, memberName);
  const next: AttendanceState = {};
  for (const [date, day] of Object.entries(state)) {
    const copy = { ...day };
    if (copy[fromKey]) {
      if (!copy[toKey]) copy[toKey] = copy[fromKey];
      delete copy[fromKey];
    }
    next[date] = copy;
  }
  return next;
}

export function buildAnalytics(
  roster: Roster,
  state: AttendanceState,
  submissions: SubmissionsState,
  currentDate: string,
): AttendanceAnalytics {
  const totalMembers = countRoster(roster);
  const totalActive = countActiveMembers(roster);
  const totalIcu = Math.max(totalMembers - totalActive, 0);
  const totalLeaders = Object.keys(roster).length;
  const day = state[currentDate] || {};
  const totals = dayTotals(roster, day);

  let submittedGroups = 0;
  const byGroup: GroupAnalytics[] = Object.entries(roster).map(
    ([group, record]) => {
      let present = 0;
      let absent = 0;
      const members = record.members || [];
      const icu = (record.icu || []).length;
      for (const member of members) {
        const status = day[personKey(group, member.name)];
        if (status === "present") present += 1;
        if (status === "absent") absent += 1;
      }
      const marked = present + absent;
      const sub = submissions[submissionKey(group, currentDate)];
      if (sub?.submittedAt) submittedGroups += 1;
      return {
        group,
        label: leaderLabel(group),
        members: members.length,
        icu,
        present,
        absent,
        unmarked: Math.max(members.length - present - absent, 0),
        rate: marked ? Math.round((present / marked) * 100) : 0,
        submitted: Boolean(sub?.submittedAt),
        photos: sub?.images.length || 0,
      };
    },
  );

  const dates = new Set<string>(Object.keys(state));
  for (const key of Object.keys(submissions)) {
    const date = key.split("|").pop();
    if (date) dates.add(date);
  }
  dates.add(currentDate);

  const recentWeeks = Array.from(dates)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 8)
    .map((date) => {
      const weekTotals = dayTotals(roster, state[date] || {});
      let submitted = 0;
      for (const group of Object.keys(roster)) {
        if (submissions[submissionKey(group, date)]?.submittedAt) submitted += 1;
      }
      return {
        date,
        ...weekTotals,
        submittedGroups: submitted,
        totalGroups: totalLeaders,
      };
    });

  const trendWeeks = [...recentWeeks].reverse();

  const weeksWithMarks = recentWeeks.filter(
    (week) => week.present + week.absent > 0,
  );
  const averageRate = weeksWithMarks.length
    ? Math.round(
        weeksWithMarks.reduce((sum, week) => sum + week.rate, 0) /
          weeksWithMarks.length,
      )
    : 0;

  return {
    totalMembers,
    totalActive,
    totalIcu,
    totalLeaders,
    thisWeek: {
      date: currentDate,
      ...totals,
      submittedGroups,
      totalGroups: totalLeaders,
    },
    byGroup,
    recentWeeks,
    trendWeeks,
    averageRate,
  };
}

export function emptySubmission(
  group: string,
  date: string,
  attendance: DayAttendance = {},
): WeekSubmission {
  return {
    group,
    date,
    attendance,
    images: [],
    notes: "",
    submittedAt: null,
  };
}

export async function compressImageFile(
  file: File,
  maxDim = 1280,
  quality = 0.72,
): Promise<SubmissionImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name || "photo.jpg",
    dataUrl,
    addedAt: new Date().toISOString(),
  };
}

function stripHeavyImages(submissions: SubmissionsState): SubmissionsState {
  const next: SubmissionsState = {};
  for (const [key, submission] of Object.entries(submissions)) {
    next[key] = {
      ...submission,
      // Keep images in cloud sync so other devices can view submissions
      images: (submission.images || []).slice(0, MAX_IMAGES_PER_SUBMISSION),
    };
  }
  return next;
}

export async function loadCloudSync(
  syncId: string,
): Promise<CloudPayload | null> {
  try {
    const response = await fetch(`${SYNC_API}/${syncId}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<CloudPayload>;
    if (!data || typeof data !== "object") return null;
    return {
      version: 2,
      roster: normalizeRoster(data.roster),
      attendance:
        data.attendance && typeof data.attendance === "object"
          ? data.attendance
          : {},
      submissions:
        data.submissions && typeof data.submissions === "object"
          ? data.submissions
          : {},
      updatedAt:
        typeof data.updatedAt === "string"
          ? data.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveCloudSync(
  syncId: string | null,
  payload: Omit<CloudPayload, "version" | "updatedAt"> & {
    updatedAt?: string;
  },
): Promise<string> {
  const body: CloudPayload = {
    version: 2,
    roster: payload.roster,
    attendance: payload.attendance,
    submissions: stripHeavyImages(payload.submissions),
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };

  if (syncId) {
    const update = await fetch(`${SYNC_API}/${syncId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (update.ok) return syncId;
  }

  const create = await fetch(SYNC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!create.ok) {
    throw new Error("Could not save to shared church link.");
  }
  const location = create.headers.get("Location") || "";
  const createdId = location.split("/").filter(Boolean).pop();
  if (!createdId) throw new Error("Could not create shared church link.");
  return createdId;
}
