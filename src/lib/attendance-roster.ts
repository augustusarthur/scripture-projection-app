export type AttendanceStatus = "present" | "absent";

export type DayAttendance = Record<string, AttendanceStatus>;

export type AttendanceState = Record<string, DayAttendance>;

export type Roster = Record<string, string[]>;

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

export function personKey(group: string, name: string) {
  return `${group}|${name}`;
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
