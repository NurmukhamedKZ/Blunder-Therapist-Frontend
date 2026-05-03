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
    <div className="flex flex-col h-full w-full shadow-xl rounded-3xl overflow-hidden border border-[#2c1f14]/5 bg-[#f5f0ea]">
      <div className="bg-white p-6 border-b border-[#2c1f14]/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)] animate-pulse" />
            <h3 className="font-display text-xl text-[#2c1f14] tracking-tight">Behavioral Coach</h3>
         </div>
         <button 
           onClick={handleNewChat}
           className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f5f0ea] hover:bg-[#ede8e0] text-[#7a6454] hover:text-[#2c1f14] transition-all border border-[#2c1f14]/5 text-xs font-semibold"
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
