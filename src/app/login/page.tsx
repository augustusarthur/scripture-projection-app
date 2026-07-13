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

export default function LoginPage() {
  const router = useRouter();
  const [from, setFrom] = useState("/dashboard");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFrom(params.get("from") || "/dashboard");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : data.error?.email?.[0] || data.error?.password?.[0] || "Login failed",
      );
      setLoading(false);
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <AuthForm
      title="Sign in"
      subtitle="Pastor access only"
      footer={
        <p className="text-stone-600">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Register your church branch
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="Username">
          <input
            type="text"
            className={fieldClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password"
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </FormField>

        <button type="submit" disabled={loading} className={buttonPrimaryClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthForm>
  );
}
