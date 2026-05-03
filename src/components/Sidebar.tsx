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
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-16 lg:w-64 flex flex-col h-screen bg-[#f5f0ea] py-6 shrink-0 transition-all border-r border-[#2c1f14]/10">
      <div className="px-4 mb-8 flex justify-center lg:justify-start lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#a0724a] flex items-center justify-center shrink-0 shadow-lg shadow-[#a0724a]/20 text-[#f5f0ea]">
            <ChessLogo size={20} />
          </div>
          <h1 className="hidden lg:block font-display text-xl tracking-tight text-[#2c1f14] font-semibold">
            Blunder<span className="text-[#a0724a]">.</span>Therapist
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
                  ? "bg-[#a0724a]/10 text-[#a0724a] font-medium"
                  : "text-[#7a6454] hover:bg-[#a0724a]/5 hover:text-[#2c1f14]"
              )}
            >
              <Icon size={20} className={clsx("shrink-0", isActive ? "text-[#a0724a]" : "text-[#7a6454]")} />
              <span className="hidden lg:block text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 lg:px-4 mt-auto pt-4 border-t border-[#2c1f14]/5">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-[#2c1f14]/5">
              <div className="w-8 h-8 rounded-full bg-[#a0724a] flex items-center justify-center text-xs shrink-0 font-medium text-white shadow-sm">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="truncate text-sm text-[#7a6454] font-medium">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-[#7a6454] hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut size={20} className="shrink-0" />
              <span className="hidden lg:block text-sm font-medium">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-[#7a6454] hover:bg-[#a0724a]/5 hover:text-[#2c1f14] transition-colors w-full"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block text-sm font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
