import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAge, fullName, statusLabel } from "@/lib/utils";
import { UserPlus, Users, Share2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [profiles, shareCount] = await Promise.all([
    db.singleProfile.findMany({
      where: { churchId: session.churchId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.profileShare.count({ where: { sharedWithId: session.id } }),
  ]);

  const activeCount = profiles.filter((p) => p.status === "active").length;
  const matchedCount = profiles.filter((p) => p.status === "matched").length;

  return (
    <AppShell pastor={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-stone-600">
          Welcome back, {session.firstName}. Managing profiles for{" "}
          {session.churchName}.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {profiles.length}
              </p>
              <p className="text-sm text-stone-600">Total profiles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-stone-900">{activeCount}</p>
              <p className="text-sm text-stone-600">Active ({matchedCount} matched)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Share2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-stone-900">{shareCount}</p>
              <p className="text-sm text-stone-600">Shared with you</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          Church profiles
        </h2>
        <Link
          href="/profiles/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Add profile
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-600">No profiles yet.</p>
          <Link
            href="/profiles/new"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Create your first profile →
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {profiles.map((profile) => {
            const age = calculateAge(profile.dateOfBirth);
            return (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-stone-50"
              >
                {profile.photoUrl ? (
                  <ProfilePhoto
                    src={profile.photoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-600">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-stone-900">
                    {fullName(profile.firstName, profile.lastName)}
                    {age !== null && (
                      <span className="ml-2 text-sm font-normal text-stone-500">
                        {age}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-stone-500 capitalize">
                    {profile.gender}
                    {profile.city && ` · ${profile.city}`}
                    {profile.state && `, ${profile.state}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    profile.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : profile.status === "matched"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {statusLabel(profile.status)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
