import Link from "next/link";
import { Church, Heart, Share2, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-full bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Church className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-semibold text-stone-900">
              Shepherd Connect
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Pastor-led singles coordination
            <span className="block text-emerald-600">across church branches</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
            Shepherd Connect helps pastors manage single member profiles within
            their congregation and share them securely with trusted pastors at
            other First Love Church branches.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
            <Link
              href="/scripture"
              className="rounded-lg border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Scripture projector
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
        Shepherd Connect — First Love Church network
      </footer>
    </div>
  );
}
