import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fieldClass } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PastorsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q } = await searchParams;
  const query = q?.trim();

  const pastors = await db.pastor.findMany({
    where: {
      id: { not: session.id },
      ...(query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
              { church: { name: { contains: query } } },
              { church: { city: { contains: query } } },
              { church: { state: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      church: { select: { name: true, city: true, state: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 50,
  });

  return (
    <AppShell pastor={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Find Pastors</h1>
        <p className="mt-1 text-stone-600">
          Search pastors across First Love Church branches to coordinate
          introductions.
        </p>
      </div>

      <form method="get" className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        <input
          name="q"
          defaultValue={query}
          className={`${fieldClass} pl-9`}
          placeholder="Search by name, email, or church..."
        />
      </form>

      {pastors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-600">No pastors found.</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {pastors.map((p) => (
            <div key={p.id} className="px-5 py-4">
              <p className="font-medium text-stone-900">
                {p.firstName} {p.lastName}
              </p>
              <p className="text-sm text-stone-500">{p.email}</p>
              <p className="mt-1 text-sm text-stone-600">
                {p.church.name} — {p.church.city}, {p.church.state}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
