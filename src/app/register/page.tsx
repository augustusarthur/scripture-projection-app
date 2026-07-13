"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthForm,
  buttonPrimaryClass,
  fieldClass,
  FormField,
} from "@/components/AuthForm";

type Church = {
  id: string;
  name: string;
  city: string;
  state: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [churches, setChurches] = useState<Church[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    churchId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/churches")
      .then((r) => r.json())
      .then((data) => setChurches(data.churches || []));
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
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
        setFormError(data.error || "Registration failed");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthForm
      title="Pastor registration"
      subtitle="Select your church branch to get started"
      footer={
        <p className="text-stone-600">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" error={errors.firstName}>
            <input
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Last Name" error={errors.lastName}>
            <input
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            className={fieldClass}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" error={errors.password}>
          <input
            type="password"
            className={fieldClass}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Church Branch" error={errors.churchId}>
          <select
            className={fieldClass}
            value={form.churchId}
            onChange={(e) => updateField("churchId", e.target.value)}
            required
          >
            <option value="">Select your branch...</option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city}, {c.state}
              </option>
            ))}
          </select>
        </FormField>

        <button type="submit" disabled={loading} className={buttonPrimaryClass}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthForm>
  );
}
