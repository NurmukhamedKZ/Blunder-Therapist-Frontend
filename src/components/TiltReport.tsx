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
    <div className="rounded-2xl bg-gradient-to-br from-ink-700 to-ink-800 border border-ink-600 p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${meta.tint}`} />
        <span className={`text-xs uppercase tracking-widest ${meta.tint}`}>
          Pattern: {meta.label}
        </span>
      </div>

      <h2 className="font-display text-2xl mb-3 leading-tight">
        {report.headline}
      </h2>

      <p className="text-ink-500 leading-relaxed text-sm mb-6">
        {report.diagnosis}
      </p>

      <div className="border-t border-ink-600 pt-4">
        <p className="text-xs uppercase tracking-widest text-accent-500 mb-2">
          What to try next
        </p>
        <p className="text-sm leading-relaxed">{report.suggestion}</p>
      </div>

      {report.evidence_plies.length > 0 && (
        <div className="mt-4 text-xs text-ink-500">
          Evidence from moves:{" "}
          {report.evidence_plies.map((p) => Math.ceil((p + 1) / 2)).join(", ")}
        </div>
      )}
    </div>
  );
}
