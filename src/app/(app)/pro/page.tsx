import { Check } from "lucide-react";
import clsx from "clsx";

export default function ProPage() {
  return (
    <div className="min-h-full w-full flex flex-col items-center py-20 px-6 overflow-y-auto bg-[#ede8e0]">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="font-display text-5xl md:text-6xl mb-6 text-[#2c1f14] font-medium tracking-tight text-center">
          Upgrade to <span className="text-[#a0724a]">Pro</span>
        </h1>
        <p className="text-[#7a6454] mb-16 text-center text-xl max-w-lg font-light leading-relaxed">
          Unlock a personal AI coach that studies every move you make.
        </p>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Free Tier */}
          <div className="rounded-3xl border border-[#2c1f14]/5 bg-white p-10 flex flex-col shadow-xl shadow-[#2c1f14]/5">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#7a6454] mb-6 uppercase">
              Free Tier
            </h3>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-display text-[#2c1f14]">$0</span>
            </div>

            <div className="w-full h-px bg-[#2c1f14]/5 mb-8"></div>

            <ul className="space-y-5 mb-12 flex-1">
              {[
                "Unlimited game analysis",
                "Limited Replay Mistakes",
                "GM Puzzles",
                "2 AI Coach games per week",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-[15px] text-[#7a6454]">
                  <div className="mt-1 rounded-full bg-[#f5f0ea] p-1 text-[#a0724a]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-xl border-2 border-[#2c1f14]/5 text-sm font-bold text-[#7a6454] hover:bg-[#f5f0ea] transition-all">
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl bg-[#2c1f14] p-10 flex flex-col relative shadow-2xl shadow-black/20 transform md:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#a0724a] uppercase">
                Pro Tier
              </h3>
              <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-[#a0724a]/20 border border-[#a0724a]/30 text-[#a0724a]">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-display text-white">$8.49</span>
              <span className="text-sm text-[#7a6454]">/mo</span>
            </div>

            <div className="w-full h-px bg-white/10 mb-8"></div>

            <ul className="space-y-5 mb-12 flex-1">
              {[
                "Everything in Free",
                "Unlimited Replay Mistakes",
                "Unlimited AI Coach on every game",
                "Unlimited questions to Coach",
                "Coach remembers your mistakes",
                "Priority access to new features",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-[15px] text-white/90">
                  <div className="mt-1 rounded-full bg-[#a0724a]/20 p-1 text-[#a0724a]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-xl bg-[#a0724a] text-white text-sm font-bold hover:bg-[#8c6340] transition-all shadow-lg shadow-[#a0724a]/20">
              Upgrade to Pro
            </button>
          </div>
        </div>

        <p className="mt-16 text-[10px] font-bold tracking-widest text-[#7a6454]/50 text-center uppercase">
          Secure payment processing via Stripe
        </p>
      </div>
    </div>
  );
}
