"use client";

import { Check, Sparkles } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (loading) return;
    setLoading(true);
    try {
      await api.upgrade();
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      alert("Upgrade failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center py-20 px-6 overflow-y-auto bg-[var(--bg-app)]">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="font-display text-5xl md:text-6xl mb-6 text-[var(--text-main)] font-medium tracking-tight text-center">
          Upgrade to <span className="text-[var(--accent)]">Pro</span>
        </h1>
        <p className="text-[var(--text-muted)] mb-16 text-center text-xl max-w-lg font-light leading-relaxed">
          Unlock a personal AI coach that studies every move you make.
        </p>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Free Tier */}
          <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-sidebar)] p-10 flex flex-col shadow-xl shadow-black/5">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] mb-6 uppercase">
              Free Tier
            </h3>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-display text-[var(--text-main)]">$0</span>
            </div>

            <div className="w-full h-px bg-[var(--border-soft)] mb-8"></div>

            <ul className="space-y-5 mb-12 flex-1">
              {[
                "Unlimited game analysis",
                "Limited Replay Mistakes",
                "GM Puzzles",
                "2 AI Coach games per week",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-[15px] text-[var(--text-muted)]">
                  <div className="mt-1 rounded-full bg-[var(--bg-app)] p-1 text-[var(--accent)]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-all">
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl bg-[var(--text-main)] p-10 flex flex-col relative shadow-2xl shadow-black/20 transform md:scale-105 border border-[var(--border-soft)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                Pro Tier
              </h3>
              <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-display text-[var(--bg-app)]">$8.49</span>
              <span className="text-sm text-[var(--text-muted)]">/mo</span>
            </div>

            <div className="w-full h-px bg-[var(--bg-app)]/20 mb-8"></div>

            <ul className="space-y-5 mb-12 flex-1">
              {[
                "Everything in Free",
                "Unlimited Replay Mistakes",
                "Unlimited AI Coach on every game",
                "Unlimited questions to Coach",
                "Coach remembers your mistakes",
                "Priority access to new features",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-[15px] text-[var(--bg-app)]">
                  <div className="mt-1 rounded-full bg-[var(--accent)]/20 p-1 text-[var(--accent)]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Upgrading..." : (
                <>
                  <Sparkles size={16} />
                  Upgrade to Pro
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-16 text-[10px] font-bold tracking-widest text-[var(--text-muted)]/50 text-center uppercase">
          Temporary instant upgrade enabled
        </p>
      </div>
    </div>
  );
}
