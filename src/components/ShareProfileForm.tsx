"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  buttonPrimaryClass,
  fieldClass,
  FormField,
} from "@/components/AuthForm";

type Pastor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  church: { name: string; city: string; state: string };
};

type ShareProfileFormProps = {
  profileId: string;
  profileName: string;
};

export function ShareProfileForm({
  profileId,
  profileName,
}: ShareProfileFormProps) {
  const [query, setQuery] = useState("");
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setSearching(true);
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/pastors${params}`);
      const data = await res.json();
      setPastors(data.pastors || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      setError("Please select a pastor");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, sharedWithId: selectedId, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : data.error?.sharedWithId?.[0] || "Failed to share profile",
      );
      setLoading(false);
      return;
    }

    setSuccess(`Profile shared with ${data.share.sharedWith.firstName} ${data.share.sharedWith.lastName}`);
    setSelectedId("");
    setMessage("");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-stone-900">
        Share {profileName}
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        Send this profile to another pastor in the network.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {success && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="Search pastors">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search by name, email, or church..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </FormField>

        <FormField label="Select pastor">
          <select
            className={fieldClass}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">
              {searching ? "Searching..." : "Choose a pastor"}
            </option>
            {pastors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} — {p.church.name} ({p.church.city},{" "}
                {p.church.state})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Message (optional)">
          <textarea
            className={fieldClass}
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note for the receiving pastor..."
          />
        </FormField>

        <button
          type="submit"
          disabled={loading || !selectedId}
          className={buttonPrimaryClass}
        >
          {loading ? "Sharing..." : "Share Profile"}
        </button>
      </form>
    </div>
  );
}
