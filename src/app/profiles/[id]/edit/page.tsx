import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function EditProfilePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const profile = await db.singleProfile.findUnique({ where: { id } });

  if (!profile || profile.churchId !== session.churchId) {
    notFound();
  }

  return (
    <AppShell pastor={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Edit Profile</h1>
        <p className="mt-1 text-stone-600">
          Update {profile.firstName} {profile.lastName}&apos;s profile.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <ProfileForm
          profileId={profile.id}
          initialData={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            dateOfBirth: profile.dateOfBirth?.toISOString(),
            gender: profile.gender as "male" | "female",
            height: profile.height ?? undefined,
            city: profile.city ?? undefined,
            state: profile.state ?? undefined,
            phone: profile.phone ?? undefined,
            email: profile.email ?? undefined,
            occupation: profile.occupation ?? undefined,
            education: profile.education ?? undefined,
            bio: profile.bio ?? undefined,
            faithBackground: profile.faithBackground ?? undefined,
            interests: profile.interests ?? undefined,
            lookingFor: profile.lookingFor ?? undefined,
            languages: profile.languages ?? undefined,
            status: profile.status as "active" | "matched" | "inactive",
            pastorNotes: profile.pastorNotes ?? undefined,
            photoUrl: profile.photoUrl,
          }}
          submitLabel="Save Changes"
          redirectTo={`/profiles/${profile.id}`}
        />
      </div>
    </AppShell>
  );
}
