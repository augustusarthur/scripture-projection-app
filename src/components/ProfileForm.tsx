"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  fieldClass,
  FormField,
} from "@/components/AuthForm";

type ProfileData = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  height?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  faithBackground?: string;
  interests?: string;
  lookingFor?: string;
  languages?: string;
  status: "active" | "matched" | "inactive";
  pastorNotes?: string;
  photoUrl?: string | null;
};

type ProfileFormProps = {
  profileId?: string;
  initialData?: Partial<ProfileData>;
  submitLabel?: string;
  redirectTo?: string;
};

const defaultData: ProfileData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "male",
  height: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  occupation: "",
  education: "",
  bio: "",
  faithBackground: "",
  interests: "",
  lookingFor: "",
  languages: "",
  status: "active",
  pastorNotes: "",
};

export function ProfileForm({
  profileId,
  initialData,
  submitLabel = "Save Profile",
  redirectTo,
}: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>({
    ...defaultData,
    ...initialData,
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
      : "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photoUrl ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  function updateField(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError("");

    const url = profileId ? `/api/profiles/${profileId}` : "/api/profiles";
    const method = profileId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error && typeof data.error === "object") {
        const flat: Record<string, string> = {};
        for (const [key, val] of Object.entries(data.error)) {
          flat[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setErrors(flat);
      } else {
        setFormError(data.error || "Something went wrong");
      }
      setLoading(false);
      return;
    }

    const savedId = profileId || data.profile?.id;

    if (photoFile && savedId) {
      const photoData = new FormData();
      photoData.append("photo", photoFile);
      await fetch(`/api/profiles/${savedId}`, {
        method: "POST",
        body: photoData,
      });
    }

    router.push(redirectTo || `/profiles/${savedId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="flex items-start gap-6">
        <div className="shrink-0">
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Profile preview"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-stone-200"
              unoptimized
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-200 text-stone-500">
              No photo
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="mt-2 block w-full text-xs text-stone-600"
          />
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <FormField label="First Name *" error={errors.firstName}>
            <input
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Last Name *" error={errors.lastName}>
            <input
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Date of Birth" error={errors.dateOfBirth}>
            <input
              type="date"
              className={fieldClass}
              value={form.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
            />
          </FormField>
          <FormField label="Gender *" error={errors.gender}>
            <select
              className={fieldClass}
              value={form.gender}
              onChange={(e) =>
                updateField("gender", e.target.value as "male" | "female")
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </FormField>
          <FormField label="Height" error={errors.height}>
            <input
              className={fieldClass}
              placeholder="e.g. 5 ft 10 in"
              value={form.height}
              onChange={(e) => updateField("height", e.target.value)}
            />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <select
              className={fieldClass}
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value as "active" | "matched" | "inactive",
                )
              }
            >
              <option value="active">Active</option>
              <option value="matched">Matched</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" error={errors.city}>
          <input
            className={fieldClass}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </FormField>
        <FormField label="State" error={errors.state}>
          <input
            className={fieldClass}
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
        </FormField>
        <FormField label="Phone" error={errors.phone}>
          <input
            type="tel"
            className={fieldClass}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            className={fieldClass}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </FormField>
        <FormField label="Occupation" error={errors.occupation}>
          <input
            className={fieldClass}
            value={form.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
          />
        </FormField>
        <FormField label="Education" error={errors.education}>
          <input
            className={fieldClass}
            value={form.education}
            onChange={(e) => updateField("education", e.target.value)}
          />
        </FormField>
        <FormField label="Languages" error={errors.languages}>
          <input
            className={fieldClass}
            placeholder="English, Russian, ..."
            value={form.languages}
            onChange={(e) => updateField("languages", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Bio" error={errors.bio}>
        <textarea
          className={fieldClass}
          rows={3}
          value={form.bio}
          onChange={(e) => updateField("bio", e.target.value)}
        />
      </FormField>

      <FormField label="Faith Background" error={errors.faithBackground}>
        <textarea
          className={fieldClass}
          rows={2}
          value={form.faithBackground}
          onChange={(e) => updateField("faithBackground", e.target.value)}
        />
      </FormField>

      <FormField label="Interests" error={errors.interests}>
        <textarea
          className={fieldClass}
          rows={2}
          value={form.interests}
          onChange={(e) => updateField("interests", e.target.value)}
        />
      </FormField>

      <FormField label="Looking For" error={errors.lookingFor}>
        <textarea
          className={fieldClass}
          rows={2}
          value={form.lookingFor}
          onChange={(e) => updateField("lookingFor", e.target.value)}
        />
      </FormField>

      <FormField label="Pastor Notes (private)" error={errors.pastorNotes}>
        <textarea
          className={fieldClass}
          rows={3}
          value={form.pastorNotes}
          onChange={(e) => updateField("pastorNotes", e.target.value)}
        />
      </FormField>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className={buttonPrimaryClass}>
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          className={buttonSecondaryClass}
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
