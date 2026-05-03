"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Swords, Puzzle, Crown, LogOut, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Play", href: "/play", icon: Swords },
  { name: "Puzzles", href: "#", icon: Puzzle },
  { name: "Upload PGN", href: "#", icon: Upload },
  { name: "Pro", href: "/pro", icon: Crown },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-16 lg:w-64 flex flex-col h-screen bg-ink-800 py-6 shrink-0 transition-all border-r border-ink-700">
      <div className="px-4 mb-8 flex justify-center lg:justify-start lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-500 flex items-center justify-center shrink-0 shadow-lg shadow-accent-500/20">
            <Swords size={18} className="text-white" />
          </div>
          <h1 className="hidden lg:block font-display text-xl tracking-tight text-white font-semibold">
            Blunder<span className="text-accent-500">.</span>Therapist
          </h1>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 px-2 lg:px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl transition-all",
                isActive
                  ? "bg-accent-500/10 text-accent-500 font-medium shadow-inner"
                  : "text-ink-400 hover:bg-ink-700 hover:text-white"
              )}
            >
              <Icon size={20} className={clsx("shrink-0", isActive ? "text-accent-500" : "")} />
              <span className="hidden lg:block text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 lg:px-4 mt-auto pt-4 border-t border-ink-700/50">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-ink-900/50">
              <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-xs shrink-0 font-medium text-white shadow-sm">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="truncate text-sm text-ink-300 font-medium">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-ink-400 hover:bg-ink-700 hover:text-signal-red transition-colors w-full"
            >
              <LogOut size={20} className="shrink-0" />
              <span className="hidden lg:block text-sm font-medium">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-ink-400 hover:bg-ink-700 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block text-sm font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
