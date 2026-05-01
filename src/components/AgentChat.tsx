// frontend/src/components/AgentChat.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { agentApi, type TiltDetectorResponse } from "@/lib/api";
import { parseAgentStream } from "@/lib/agent-stream";
import { AgentMessage, type ChatMessage } from "./AgentMessage";

interface Props {
  threadId: string;
  tiltReport: TiltDetectorResponse | null;
}

let _id = 0;
const nextId = () => `m${++_id}`;

export function AgentChat({ threadId, tiltReport }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const tiltSeenRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    let cancelled = false;
    agentApi
      .history(threadId)
      .then((res) => {
        if (cancelled) return;
        setMessages(
          res.messages.map((m) => ({
            id: nextId(),
            kind: m.role === "user" ? "user" : "agent",
            text: m.content,
          })),
        );
      })
      .catch(() => {});
    // Best-effort initialize the thread on first mount
    agentApi.observe(threadId, "game_start", {}).catch(() => {});
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
      .observe(threadId, "game_end", { game_id: threadId })
      .then((r) => consumeStream(r))
      .catch(() => {});
  }, [tiltReport, threadId, consumeStream]);

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
    <div className="flex flex-col h-[600px] rounded-2xl bg-ink-800 border border-ink-600">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-ink-500 text-sm italic">I&apos;m watching. Ask me anything.</div>
        )}
        {messages.map((m) => (
          <AgentMessage key={m.id} msg={m} />
        ))}
      </div>
      <div className="border-t border-ink-600 p-3 flex gap-2">
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
          className="flex-1 bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none"
          disabled={streaming}
        />
        <button
          onClick={() => void send()}
          disabled={streaming || !input.trim()}
          className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-white text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}