import Link from "next/link";
import { Church, ClipboardCheck, Heart, Share2, Shield, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-full bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Church className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-semibold text-stone-900">
              First Love Tools
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/attendance"
              className="rounded-lg bg-[#1a3327] px-4 py-2 text-sm font-semibold text-[#f6f3ea] hover:bg-[#2c4a3b]"
            >
              Attendance
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl bg-gradient-to-br from-[#1a3327] via-[#243f32] to-[#2c4a3b] px-8 py-12 text-[#f6f3ea] shadow-lg sm:px-12">
            <p className="text-sm font-medium tracking-wide text-[#f0deb3]">
              Church attendance
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
              Attendance <span className="italic text-[#f0deb3]">Ledger</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-[#f6f3ea]/90 sm:text-lg">
              Mark present or absent by small group, switch dates, save on this
              device, and export a CSV for Sunday records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 rounded-lg bg-[#c8952f] px-6 py-3 text-sm font-semibold text-[#1a3327] hover:bg-[#d4a545]"
              >
                <ClipboardCheck className="h-4 w-4" />
                Open attendance tracker
              </Link>
              <Link
                href="/scripture"
                className="inline-flex items-center gap-2 rounded-lg border border-[#f0deb3]/40 px-6 py-3 text-sm font-semibold text-[#f6f3ea] hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4" />
                Scripture projector
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Shepherd Connect
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600">
            Pastor-led singles coordination across First Love Church branches —
            manage profiles and share securely with trusted pastors.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Get started as a pastor
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 p-6">
              <Shield className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Pastor-only access
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Only verified pastors can create profiles and view shared
                information. Singles never log in directly.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-6">
              <Heart className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Thoughtful matching
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Build detailed profiles with faith background, interests, and
                pastor notes to guide intentional introductions.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-6">
              <Share2 className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Cross-branch sharing
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Share profiles with pastors at other branches when a good match
                may be outside your local congregation.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        First Love Church tools — attendance, scripture, and Shepherd Connect
      </footer>
    </div>
  );
}
