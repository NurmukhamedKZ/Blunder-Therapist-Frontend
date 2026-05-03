// frontend/src/components/AgentMessage.tsx
"use client";

import type { TiltDetectorResponse } from "@/lib/api";
import { TiltReport } from "./TiltReport";

export type ChatMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "agent"; text: string; pending?: boolean }
  | { id: string; kind: "tilt_card"; report: TiltDetectorResponse };

export function AgentMessage({ msg }: { msg: ChatMessage }) {
  if ("text" in msg && msg.text.startsWith("[OBSERVATION]")) {
    return null;
  }
  if (msg.kind === "tilt_card") {
    return (
      <div className="my-2">
        <TiltReport report={msg.report} />
      </div>
    );
  }
  if (msg.kind === "user") {
    return (
      <div className="flex justify-end my-2">
        <div className="rounded-2xl rounded-tr-sm bg-[var(--accent)] text-[var(--bg-app)] px-4 py-2.5 max-w-[85%] text-sm shadow-md">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start my-2">
      <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] px-4 py-2.5 max-w-[85%] text-sm shadow-sm whitespace-pre-wrap">
        {msg.text}
        {msg.pending && <span className="animate-pulse text-[var(--accent)] ml-1">▍</span>}
      </div>
    </div>
  );
}