export type AttendanceStatus = "present" | "absent";

export type DayAttendance = Record<string, AttendanceStatus>;

export type AttendanceState = Record<string, DayAttendance>;

export type Roster = Record<string, string[]>;

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

export const DEFAULT_ROSTER: Roster = {
  "Aliye's Group": [
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
  ],
  "Augustus's Group": [
    "Dieumerci",
    "Ashlee",
    "Brian",
    "Furri",
    "Pastor Glodie",
    "Pressley",
    "Terrence",
    "Israel",
    "Gerald",
    "Uyi",
    "Aliye",
    "Chancela",
    "Chidi",
    "Diana",
    "Ephraim",
    "Jeff",
    "Korey",
    "Mama Vivian",
    "Nancy",
    "Shalyne",
  ],
  "Diana's Group": ["Caleb", "Dawit", "Ian", "Kameron", "Lady Nikki", "Rehema"],
  "Naa's Group": [
    "Chiche",
    "Kriti",
    "Mac Noble",
    "Mya",
    "Tarmadji",
    "Theresa",
    "Treasure",
  ],
  "Shalyne's Group": [
    "Eden M",
    "Morris",
    "Talent",
    "Trishana",
    "Vanessa",
    "Dennis",
    "Brian",
    "Douglas",
    "Maru",
  ],
  "Needs a Group": ["Lucky", "Atrel/Joseph", "Dezhon", "Johan"],
};

export const ATTENDANCE_STORAGE_KEY = "church-attendance-state-v1";
export const ROSTER_STORAGE_KEY = "church-attendance-roster-v1";
export const SUBMISSIONS_STORAGE_KEY = "church-attendance-submissions-v1";

export const MAX_IMAGES_PER_SUBMISSION = 8;

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

export function countRoster(roster: Roster) {
  return Object.values(roster).reduce((sum, people) => sum + people.length, 0);
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
