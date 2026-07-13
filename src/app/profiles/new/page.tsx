import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";
import { getSession } from "@/lib/auth";

export default async function NewProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell pastor={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Add Profile</h1>
        <p className="mt-1 text-stone-600">
          Create a new single member profile for {session.churchName}.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <ProfileForm submitLabel="Create Profile" />
      </div>
    </AppShell>
  );
}
