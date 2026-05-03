"use client";

import type { TiltDetectorResponse } from "@/lib/api";
import { Flame, Brain, Wind, Zap, Snail, Coffee, Compass, Scale } from "lucide-react";

const PATTERN_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tint: string; label: string }
> = {
  tilt: { icon: Flame, tint: "text-signal-red", label: "Tilt" },
  panic: { icon: Wind, tint: "text-signal-red", label: "Panic" },
  rushing: { icon: Zap, tint: "text-signal-amber", label: "Rushing" },
  overconfidence: { icon: Coffee, tint: "text-signal-amber", label: "Overconfidence" },
  analysis_paralysis: { icon: Snail, tint: "text-signal-amber", label: "Overthinking" },
  frustration: { icon: Flame, tint: "text-signal-red", label: "Frustration" },
  steady: { icon: Scale, tint: "text-signal-green", label: "Steady" },
  focused: { icon: Compass, tint: "text-signal-green", label: "Focused" },
};

export function TiltReport({ report }: { report: TiltDetectorResponse }) {
  const meta = PATTERN_META[report.pattern_label] ?? {
    icon: Brain,
    tint: "text-accent-500",
    label: report.pattern_label,
  };
  const Icon = meta.icon;

  return (
    <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-8 shadow-xl shadow-black/5 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative">
        <div className={`p-2 rounded-xl bg-opacity-10 ${meta.tint.replace('text-', 'bg-')}`}>
          <Icon className={`w-5 h-5 ${meta.tint}`} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${meta.tint} opacity-80`}>
          {meta.label} Detected
        </span>
      </div>

      <h2 className="font-display text-3xl mb-4 leading-tight text-[var(--text-main)] relative">
        {report.headline}
      </h2>

      <p className="text-[var(--text-muted)] leading-relaxed text-sm mb-8 relative">
        {report.diagnosis}
      </p>

      <div className="bg-[var(--bg-app)] rounded-2xl p-6 border border-[var(--accent)]/10 relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
          Coaching Suggestion
        </p>
        <p className="text-[var(--text-main)] text-sm leading-relaxed font-medium">{report.suggestion}</p>
      </div>

      {report.evidence_plies.length > 0 && (
        <div className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]/40 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]/40" />
          Evidence from moves:{" "}
          <span className="text-[var(--text-muted)]/60">
            {report.evidence_plies.map((p) => Math.ceil((p + 1) / 2)).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
