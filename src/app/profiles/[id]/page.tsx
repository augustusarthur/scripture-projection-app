import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ShareProfileForm } from "@/components/ShareProfileForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAge, formatDate, fullName, statusLabel } from "@/lib/utils";
import { Pencil } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

async function getProfileAccess(id: string, pastorId: string, churchId: string) {
  const profile = await db.singleProfile.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      church: { select: { name: true, city: true, state: true } },
      shares: { where: { sharedWithId: pastorId } },
    },
  });

  if (!profile) return null;

  const isOwner = profile.churchId === churchId;
  const isShared = profile.shares.length > 0;

  if (!isOwner && !isShared) return null;

  return { profile, isOwner };
}

export default async function ProfileDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const access = await getProfileAccess(id, session.id, session.churchId);
  if (!access) notFound();

  const { profile, isOwner } = access;
  const age = calculateAge(profile.dateOfBirth);

  const fields = [
    { label: "Date of Birth", value: formatDate(profile.dateOfBirth) },
    { label: "Age", value: age !== null ? String(age) : "—" },
    { label: "Gender", value: profile.gender },
    { label: "Height", value: profile.height },
    { label: "City", value: profile.city },
    { label: "State", value: profile.state },
    { label: "Phone", value: profile.phone },
    { label: "Email", value: profile.email },
    { label: "Occupation", value: profile.occupation },
    { label: "Education", value: profile.education },
    { label: "Languages", value: profile.languages },
    { label: "Status", value: statusLabel(profile.status) },
  ];

  return (
    <AppShell pastor={session}>
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-5">
          {profile.photoUrl ? (
            <ProfilePhoto
              src={profile.photoUrl}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-stone-200"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-200 text-2xl font-medium text-stone-600">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {fullName(profile.firstName, profile.lastName)}
            </h1>
            <p className="mt-1 text-stone-600">
              {profile.church.name} · {profile.church.city},{" "}
              {profile.church.state}
            </p>
            {!isOwner && (
              <p className="mt-1 text-sm text-emerald-700">
                Shared with you by {profile.createdBy.firstName}{" "}
                {profile.createdBy.lastName}
              </p>
            )}
          </div>
        </div>
        {isOwner && (
          <Link
            href={`/profiles/${id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">Details</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm capitalize text-stone-900">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {[
            { title: "Bio", value: profile.bio },
            { title: "Faith Background", value: profile.faithBackground },
            { title: "Interests", value: profile.interests },
            { title: "Looking For", value: profile.lookingFor },
          ].map(({ title, value }) =>
            value ? (
              <div
                key={title}
                className="rounded-xl border border-stone-200 bg-white p-6"
              >
                <h2 className="text-lg font-semibold text-stone-900">
                  {title}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                  {value}
                </p>
              </div>
            ) : null,
          )}

          {isOwner && profile.pastorNotes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-semibold text-amber-900">
                Pastor Notes (private)
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">
                {profile.pastorNotes}
              </p>
            </div>
          )}
        </div>

        {isOwner && (
          <ShareProfileForm
            profileId={profile.id}
            profileName={fullName(profile.firstName, profile.lastName)}
          />
        )}
      </div>
    </AppShell>
  );
}
