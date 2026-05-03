"use client";

import { useEffect, useState } from "react";
import { AgentChat } from "./AgentChat";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";

export function DashboardAgent() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(() => Date.now().toString());
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Use a session-specific thread ID to ensure a fresh greeting on every refresh/reset
        setThreadId(`dashboard_${data.user.id}_${chatKey}`);
      }
    });
  }, [supabase, chatKey]);

  const handleNewChat = () => {
    setChatKey(Date.now().toString());
  };

  if (!threadId) return null;

  return (
    <div className="flex flex-col h-full w-full shadow-2xl rounded-2xl overflow-hidden border border-ink-700 bg-ink-800">
      <div className="bg-ink-700/50 p-4 border-b border-ink-700 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-signal-green shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <h3 className="font-display font-semibold text-white tracking-tight">Behavioral Coach</h3>
         </div>
         <button 
           onClick={handleNewChat}
           className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-300 hover:text-white transition-all border border-ink-600 text-xs font-medium"
           title="Start a new session"
         >
           <Plus size={14} />
           New Chat
         </button>
      </div>
      <div className="flex-1 min-h-0">
         <AgentChat 
            key={threadId}
            threadId={threadId} 
            tiltReport={null} 
            initialEvent="arrival"
         />
      </div>
    </div>
  );
}
