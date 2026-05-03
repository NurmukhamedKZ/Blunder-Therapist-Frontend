"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Swords, Puzzle, Crown, LogOut, Upload, Sparkles, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api, type UserProfile } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Play", href: "/play", icon: Swords },
  { name: "Puzzles", href: "#", icon: Puzzle },
  { name: "Upload PGN", href: "#", icon: Upload },
  { name: "Pro", href: "/pro", icon: Crown },
];

const ChessLogo = ({ size = 20 }: { size?: number }) => {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 2 === 0) {
        cells.push(<rect key={`${r}-${c}`} x={c * (size/4)} y={r * (size/4)} width={size/4} height={size/4} fill="currentColor"/>);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {cells}
    </svg>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      api.getProfile().then(setProfile).catch(() => {});
    } else {
      setProfile(null);
    }
  }, [user]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-16 lg:w-64 flex flex-col h-screen bg-[var(--bg-sidebar)] py-6 shrink-0 transition-all border-r border-[var(--border)]">
      <div className="px-4 mb-8 flex justify-center lg:justify-start lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-lg shadow-[var(--accent)]/20 text-[var(--bg-sidebar)]">
            <ChessLogo size={20} />
          </div>
          <h1 className="hidden lg:block font-display text-xl tracking-tight text-[var(--text-main)] font-semibold">
            Blunder<span className="text-[var(--accent)]">.</span>Therapist
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
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
              )}
            >
              <Icon size={20} className={clsx("shrink-0", isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
              <span className="hidden lg:block text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 lg:px-4 mt-auto pt-4 border-t border-[var(--border-soft)]">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)] transition-all w-full mb-2"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {mounted && (theme === "light" ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />)}
          {!mounted && <div className="w-5 h-5 shrink-0" />}
          <span className="hidden lg:block text-sm font-medium">
            {mounted ? (theme === "light" ? "Dark Mode" : "Light Mode") : "Theme"}
          </span>
        </button>

        {user ? (
          <div className="flex flex-col gap-2">
            <div className="hidden lg:flex flex-col gap-3 px-4 py-4 mb-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-soft)] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs shrink-0 font-medium text-white shadow-sm">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="truncate text-sm text-[var(--text-main)] font-semibold flex-1">{user.email}</div>
              </div>
              
              {profile && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      profile.plan === "pro" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-app)] text-[var(--text-muted)]"
                    )}>
                      {profile.plan === "pro" ? "Pro Plan" : "Free Plan"}
                    </span>
                    {profile.plan === "free" && (
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {profile.games_count}/2 games
                      </span>
                    )}
                  </div>
                  {profile.plan === "free" && (
                    <div className="w-full bg-[var(--bg-app)] h-1 rounded-full overflow-hidden">
                      <div 
                         className="bg-[var(--accent)] h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (profile.games_count / 2) * 100)}%` }}
                      />
                    </div>
                  )}
                  {profile.plan === "free" && (
                    <Link 
                      href="/pro" 
                      className="mt-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/20 text-[var(--accent)] text-[11px] font-bold transition-all"
                    >
                      <Sparkles size={12} />
                      Go Pro
                    </Link>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
            >
              <LogOut size={20} className="shrink-0" />
              <span className="hidden lg:block text-sm font-medium">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-main)] transition-colors w-full"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block text-sm font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
