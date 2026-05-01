// frontend/src/components/AgentMessage.tsx
"use client";

import type { TiltDetectorResponse } from "@/lib/api";
import { TiltReport } from "./TiltReport";

export type ChatMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "agent"; text: string; pending?: boolean }
  | { id: string; kind: "tilt_card"; report: TiltDetectorResponse };

export function AgentMessage({ msg }: { msg: ChatMessage }) {
  if (msg.kind === "tilt_card") {
    return (
      <div className="my-2">
        <TiltReport report={msg.report} />
      </div>
    );
  }
  if (msg.kind === "user") {
    return (
      <div className="flex justify-end my-1">
        <div className="rounded-2xl bg-accent-500 text-white px-3 py-2 max-w-[85%] text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start my-1">
      <div className="rounded-2xl bg-ink-700 text-ink-100 px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
        {msg.text}
        {msg.pending && <span className="animate-pulse">▍</span>}
      </div>
    </div>
  );
}