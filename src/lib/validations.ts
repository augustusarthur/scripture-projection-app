import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  churchId: z.string().min(1, "Select your church branch"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function resolveLoginEmail(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return `${trimmed.toLowerCase()}@shepherdconnect.app`;
}

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]),
  height: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  faithBackground: z.string().optional(),
  interests: z.string().optional(),
  lookingFor: z.string().optional(),
  languages: z.string().optional(),
  status: z.enum(["active", "matched", "inactive"]).default("active"),
  pastorNotes: z.string().optional(),
});

export const shareSchema = z.object({
  profileId: z.string().min(1),
  sharedWithId: z.string().min(1, "Select a pastor to share with"),
  message: z.string().optional(),
});
