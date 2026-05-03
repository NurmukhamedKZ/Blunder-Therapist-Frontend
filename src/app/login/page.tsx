"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Suspense } from "react";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setFormError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#ede8e0] flex items-center justify-center px-4 w-full">
      <div className="w-full max-w-sm bg-[#f5f0ea] p-8 rounded-3xl border border-[#2c1f14]/5 shadow-xl">
        <h1 className="font-display text-3xl tracking-tight mb-2 text-center text-[#2c1f14]">
          Blunder<span className="text-[#a0724a]">.</span>Therapist
        </h1>
        <p className="text-[#7a6454] text-sm text-center mb-8">
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </p>

        {(oauthError || formError) && (
          <p className="text-red-600 text-sm mb-4 text-center rounded-lg bg-red-50 border border-red-200 px-4 py-2">
            {formError ?? "Authentication failed. Please try again."}
          </p>
        )}

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#2c1f14]/10 hover:border-[#2c1f14]/20 hover:bg-[#2c1f14]/5 transition mb-6 text-sm font-medium text-[#2c1f14]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#2c1f14]/10" />
          <span className="text-[#7a6454] text-xs">or</span>
          <div className="flex-1 h-px bg-[#2c1f14]/10" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border border-[#2c1f14]/10 rounded-xl px-4 py-3 text-sm placeholder-[#7a6454]/50 text-[#2c1f14] focus:outline-none focus:border-[#a0724a] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white border border-[#2c1f14]/10 rounded-xl px-4 py-3 text-sm placeholder-[#7a6454]/50 text-[#2c1f14] focus:outline-none focus:border-[#a0724a] transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c1f14] hover:bg-[#1a130d] disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-medium transition shadow-lg shadow-black/10"
          >
            {loading
              ? "Loading…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setFormError(null);
          }}
          className="w-full mt-6 text-[#7a6454] text-xs hover:text-[#2c1f14] transition font-medium"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4">
        <p className="text-ink-500 text-sm">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}