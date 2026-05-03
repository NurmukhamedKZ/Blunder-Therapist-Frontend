// frontend/src/components/AgentChat.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { agentApi, type TiltDetectorResponse } from "@/lib/api";
import { parseAgentStream } from "@/lib/agent-stream";
import { AgentMessage, type ChatMessage } from "./AgentMessage";

interface Props {
  threadId: string;
  tiltReport: TiltDetectorResponse | null;
  lastObservation?: { event: "blunder"; payload: any; timestamp: number } | null;
  gameHistory?: Array<{ ply: number; san: string; eval_after: number; time_sec: number }>;
  initialEvent?: string;
}

let _id = 0;
const nextId = () => `m${++_id}`;

export function AgentChat({ threadId, tiltReport, lastObservation, gameHistory, initialEvent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const tiltSeenRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialObsPromiseRef = useRef<Promise<Response> | null>(null);

  // Load history on mount
  useEffect(() => {
    let cancelled = false;
    agentApi
      .history(threadId)
      .then((res) => {
        if (cancelled) return;
        setMessages(
          res.messages
            .filter((m) => !m.content.startsWith("[OBSERVATION]"))
            .map((m) => ({
              id: nextId(),
              kind: m.role === "user" ? "user" : "agent",
              text: m.content,
            })),
        );
      })
      .catch(() => {});
    
    // Best-effort initialize the thread on first mount
    // If it's not game_start, we might want to consume the stream (e.g. arrival greeting)
    const event = initialEvent || "game_start";
    if (!initialObsPromiseRef.current) {
      initialObsPromiseRef.current = agentApi.observe(threadId, event, {});
    }
    
    initialObsPromiseRef.current.then(resp => {
      if (cancelled) return;
      if (event !== "game_start") {
        void consumeStream(resp);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  // Stream a response into a placeholder agent message
  const consumeStream = useCallback(
    async (resp: Response) => {
      const placeholderId = nextId();
      setMessages((m) => [...m, { id: placeholderId, kind: "agent", text: "", pending: true }]);
      setStreaming(true);
      try {
        for await (const ev of parseAgentStream(resp)) {
          if (ev.type === "token") {
            setMessages((m) =>
              m.map((x) =>
                x.id === placeholderId && x.kind === "agent"
                  ? { ...x, text: x.text + ev.text }
                  : x,
              ),
            );
          } else if (ev.type === "done" || ev.type === "error") {
            setMessages((m) =>
              m
                .map((x) =>
                  x.id === placeholderId && x.kind === "agent"
                    ? { ...x, pending: false }
                    : x,
                )
                // drop empty agent placeholders (silent agent decision)
                .filter((x) => x.kind !== "agent" || x.text.length > 0),
            );
          }
        }
      } finally {
        setStreaming(false);
      }
    },
    [],
  );

  // React to a new TiltReport
  useEffect(() => {
    if (!tiltReport) return;
    if (tiltSeenRef.current === threadId) return;
    tiltSeenRef.current = threadId;
    setMessages((m) => [...m, { id: nextId(), kind: "tilt_card", report: tiltReport }]);
    agentApi
      .observe(threadId, "game_end", { game_id: threadId, all_moves: gameHistory ?? [] })
      .then((r) => consumeStream(r))
      .catch(() => {});
  }, [tiltReport, threadId, consumeStream]);

  // React to external observations (like blunders)
  const lastObsRef = useRef<number>(0);
  useEffect(() => {
    if (!lastObservation || lastObservation.timestamp <= lastObsRef.current) return;
    lastObsRef.current = lastObservation.timestamp;

    agentApi
      .observe(threadId, lastObservation.event, lastObservation.payload)
      .then((r) => consumeStream(r))
      .catch(() => {});
  }, [lastObservation, threadId, consumeStream]);

  // Close session on unmount + beforeunload
  useEffect(() => {
    const close = () => {
      agentApi.closeSession(threadId).catch(() => {});
    };
    window.addEventListener("beforeunload", close);
    return () => {
      window.removeEventListener("beforeunload", close);
      close();
    };
  }, [threadId]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), kind: "user", text }]);
    try {
      const r = await agentApi.message(threadId, text);
      await consumeStream(r);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: nextId(), kind: "agent", text: `(error: ${(e as Error).message})` },
      ]);
    }
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#f5f0ea] border border-[#2c1f14]/5 overflow-hidden shadow-inner">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-[#7a6454]/40 text-sm italic text-center mt-10">I&apos;m watching your game history. Ask me anything about your patterns.</div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <AgentMessage key={m.id} msg={m} />
          ))}
        </div>
      </div>
      <div className="bg-white border-t border-[#2c1f14]/5 p-4 flex gap-3 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask your coach..."
          className="flex-1 bg-[#f5f0ea] rounded-xl px-4 py-3 text-sm outline-none text-[#2c1f14] placeholder-[#7a6454]/50 focus:ring-2 focus:ring-[#a0724a]/20 transition-all"
          disabled={streaming}
        />
        <button
          onClick={() => void send()}
          disabled={streaming || !input.trim()}
          className="w-12 h-12 rounded-xl bg-[#2c1f14] hover:bg-[#1a130d] disabled:opacity-20 text-white flex items-center justify-center transition-all shadow-lg shadow-black/10 shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}