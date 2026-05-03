// frontend/src/components/AgentChat.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { agentApi, type TiltDetectorResponse } from "@/lib/api";
import { parseAgentStream } from "@/lib/agent-stream";
import { AgentMessage, type ChatMessage } from "./AgentMessage";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface Props {
  threadId: string;
  tiltReport: TiltDetectorResponse | null;
  lastObservation?: { event: "blunder"; payload: any; timestamp: number } | null;
  gameHistory?: Array<{ ply: number; san: string; eval_after: number; time_sec: number }>;
  initialEvent?: "game_start" | "blunder" | "game_end" | "arrival";
}

let _id = 0;
const nextId = () => `m${++_id}`;

export function AgentChat({ threadId, tiltReport, lastObservation, gameHistory, initialEvent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
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
    
    initialObsPromiseRef.current.then(async resp => {
      if (cancelled) return;
      if (resp.status === 403) {
        const body = await resp.json().catch(() => ({}));
        if (body.detail === "limit_reached") {
          setLimitReached(true);
          return;
        }
      }
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
    <div className="flex flex-col h-full rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border)] overflow-hidden shadow-inner">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-[var(--text-muted)]/40 text-sm italic text-center mt-10">I&apos;m watching your game history. Ask me anything about your patterns.</div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <AgentMessage key={m.id} msg={m} />
          ))}
        </div>
      </div>
      {limitReached ? (
        <div className="bg-[var(--bg-card)] border-t border-[var(--border)] p-6 flex flex-col gap-4 items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-2">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="text-[var(--text-main)] font-display font-bold text-lg mb-1">AI Coach Limit Reached</h4>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed max-w-[240px]">
              You&apos;ve used your 2 free games with the AI coach. Upgrade to Pro for unlimited coaching and deeper insights.
            </p>
          </div>
          <Link
            href="/pro"
            className="w-full py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--bg-app)] text-sm font-bold transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border-t border-[var(--border)] p-4 flex gap-3 items-center">
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
            className="flex-1 bg-[var(--bg-app)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            disabled={streaming}
          />
          <button
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
            className="w-12 h-12 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-20 text-[var(--bg-app)] flex items-center justify-center transition-all shadow-lg shadow-black/10 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}