"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function NavBar() {
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
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl tracking-tight">
        Blunder<span className="text-accent-500">.</span>Therapist
      </h1>
      <nav className="flex items-center gap-6 text-sm text-ink-500">
        <a href="#play" className="hover:text-white">
          Play
        </a>
        <a href="#dna" className="hover:text-white">
          Decision DNA
        </a>
        <a href="#coach" className="hover:text-white">
          Coach
        </a>
        {user && (
          <span className="text-ink-500 text-xs truncate max-w-[140px]">
            {user.email}
          </span>
        )}
        <a
          href="#"
          className="px-3 py-1.5 rounded-md border border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-white transition"
        >
          Upgrade
        </a>
        {user && (
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-md border border-ink-600 hover:border-ink-500 text-ink-500 hover:text-white transition text-xs"
          >
            Sign out
          </button>
        )}
      </nav>
    </div>
  );
}