import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAge, formatDate, fullName, statusLabel } from "@/lib/utils";

export default async function SharedPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const shares = await db.profileShare.findMany({
    where: { sharedWithId: session.id },
    include: {
      profile: true,
      sharedBy: {
        select: {
          firstName: true,
          lastName: true,
          church: { select: { name: true, city: true, state: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell pastor={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Shared With Me</h1>
        <p className="mt-1 text-stone-600">
          Profiles other pastors have shared with you.
        </p>
      </div>

      {shares.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-600">No shared profiles yet.</p>
          <Link
            href="/pastors"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Find pastors in the network →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => {
            const profile = share.profile;
            const age = calculateAge(profile.dateOfBirth);
            return (
              <div
                key={share.id}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  {profile.photoUrl ? (
                    <Image
                      src={profile.photoUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-lg font-medium text-stone-600">
                      {profile.firstName[0]}
                      {profile.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/profiles/${profile.id}`}
                      className="text-lg font-semibold text-stone-900 hover:text-emerald-700"
                    >
                      {fullName(profile.firstName, profile.lastName)}
                      {age !== null && (
                        <span className="ml-2 text-sm font-normal text-stone-500">
                          {age}
                        </span>
                      )}
                    </Link>
                    <p className="text-sm text-stone-500 capitalize">
                      {profile.gender} · {statusLabel(profile.status)}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Shared by {share.sharedBy.firstName}{" "}
                      {share.sharedBy.lastName} (
                      {share.sharedBy.church.name},{" "}
                      {share.sharedBy.church.city})
                    </p>
                    {share.message && (
                      <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                        &ldquo;{share.message}&rdquo;
                      </p>
                    )}
                    <p className="mt-2 text-xs text-stone-400">
                      {formatDate(share.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
