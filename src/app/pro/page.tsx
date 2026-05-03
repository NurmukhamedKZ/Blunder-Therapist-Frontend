import { Check } from "lucide-react";
import clsx from "clsx";

export default function ProPage() {
  return (
    <div className="min-h-full w-full flex flex-col items-center py-20 px-6 overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="font-display text-4xl md:text-5xl mb-4 text-white font-semibold tracking-tight text-center">
          Upgrade to Pro
        </h1>
        <p className="text-ink-300 mb-12 text-center text-lg max-w-lg">
          Unlock a personal AI coach on every game you play.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Free Tier */}
          <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-8 flex flex-col">
            <h3 className="text-xs font-bold tracking-widest text-ink-400 mb-4 uppercase">
              Free
            </h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-display text-white">$0</span>
            </div>

            <div className="w-full h-px bg-ink-800 mb-6"></div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Unlimited game analysis",
                "Limited Replay Mistakes",
                "GM Puzzles",
                "2 AI Coach games per week",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-300">
                  <div className="mt-0.5 rounded-full bg-ink-800 p-0.5 text-ink-500">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-xl border border-ink-700 text-sm font-medium text-ink-300 hover:text-white hover:bg-ink-800 transition-colors">
              Current plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-8 flex flex-col relative shadow-2xl shadow-accent-500/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-widest text-accent-500 uppercase">
                Pro
              </h3>
              <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-500">
                RECOMMENDED
              </span>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-display text-white">$8.49</span>
              <span className="text-sm text-ink-400">/mo</span>
            </div>

            <div className="w-full h-px bg-ink-700 mb-6"></div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Everything in Free",
                "Unlimited Replay Mistakes",
                "Unlimited AI Coach on every game",
                "Unlimited questions to Coach",
                "Coach remembers your mistakes",
                "Priority access to new features",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white">
                  <div className="mt-0.5 rounded-full bg-accent-500/20 p-0.5 text-accent-500">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-400 transition-colors shadow-lg shadow-accent-500/20">
              Upgrade to Pro
            </button>
          </div>
        </div>

        <p className="mt-10 text-xs text-ink-500 text-center">
          Manage or cancel anytime from the billing portal
        </p>
      </div>
    </div>
  );
}
