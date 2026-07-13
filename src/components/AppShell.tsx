"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Share2,
  Users,
  LogOut,
  Church,
} from "lucide-react";
import type { SessionPastor } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profiles/new", label: "Add Profile", icon: UserPlus },
  { href: "/shared", label: "Shared With Me", icon: Share2 },
  { href: "/pastors", label: "Find Pastors", icon: Users },
];

type AppShellProps = {
  pastor: SessionPastor;
  children: React.ReactNode;
};

export function AppShell({ pastor, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-full bg-stone-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-6 py-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Church className="h-7 w-7 text-emerald-600" />
            <span className="text-lg font-semibold text-stone-900">
              Shepherd Connect
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-200 px-4 py-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-stone-900">
              {pastor.firstName} {pastor.lastName}
            </p>
            <p className="text-xs text-stone-500">{pastor.churchName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
