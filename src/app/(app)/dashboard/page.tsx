"use client";

import Link from "next/link";
import { Swords, RotateCcw, Upload, Crown, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ImportGames from "@/components/ImportGames";
import { DashboardAgent } from "@/components/DashboardAgent";

import { api, type GameSummary } from "@/lib/api";

function getRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
  const minsDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
  
  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day');
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour');
  return rtf.format(minsDifference, 'minute');
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [filter, setFilter] = useState<"all" | "bots">("all");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    api.listGames(1).then(res => {
      setGames(res.games);
      setLoadingGames(false);
    }).catch(err => {
      console.error(err);
      setLoadingGames(false);
    });
  }, [supabase]);

  const displayName = user?.email ? user.email.split("@")[0] : "Player";
  const filteredGames = filter === "all" ? games : games.filter(g => g.platform === "bot" || g.platform === null);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-10 max-w-[1600px] mx-auto w-full items-start bg-[var(--bg-app)]">
      <div className="flex-1 min-w-0 w-full">
        <header className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0 border border-[var(--border)]">
            <UserIcon size={32} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-sm mb-1">Good evening,</p>
            <h2 className="text-3xl lg:text-4xl font-display text-[var(--text-main)]">
              {displayName}
            </h2>
          </div>
          <button className="ml-auto px-5 py-2 rounded-full bg-[var(--accent)] text-[var(--bg-app)] font-medium text-sm hover:opacity-90 transition-colors shadow-lg shadow-black/10">
            Upgrade
          </button>
        </header>

        <section className="mb-8">
          <Link 
            href="/play"
            className="group block bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl p-8 hover:bg-[var(--bg-card-hover)] transition-all hover:border-[var(--accent)]/20 shadow-xl shadow-black/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] group-hover:bg-[var(--accent)]/20 flex items-center justify-center transition-colors shrink-0">
                  <Swords size={28} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-display text-[var(--text-main)] mb-1">Play Now</h3>
                  <p className="text-[var(--text-muted)] text-sm">Bots or online opponents</p>
                </div>
              </div>
              <div className="px-8 py-3 rounded-full bg-[var(--accent)] text-[var(--bg-app)] group-hover:opacity-90 transition-colors text-sm font-semibold self-start sm:self-auto shadow-md">
                Start Game
              </div>
            </div>
          </Link>

          <button
            onClick={() => setShowImport(true)}
            className="group mt-4 flex w-full items-center gap-6 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl p-8 hover:bg-[var(--bg-card-hover)] transition-all hover:border-[var(--accent)]/20 shadow-xl shadow-black/5 text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] group-hover:bg-[var(--accent)]/20 flex items-center justify-center transition-colors shrink-0">
              <Upload size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-2xl font-display text-[var(--text-main)] mb-1">Import Games</h3>
              <p className="text-[var(--text-muted)] text-sm">Analyze your Chess.com or Lichess history</p>
            </div>
          </button>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8 px-6 py-4 bg-[var(--accent-soft)] border border-[var(--border-soft)] rounded-2xl overflow-hidden">
            <div className="text-[var(--text-muted)] text-sm flex flex-1 items-center gap-3 truncate">
              <span className="text-xl"></span>
              <span className="truncate"><strong>Connect Lichess</strong> to play online against real opponents</span>
            </div>
            <button className="shrink-0 px-6 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] text-[var(--text-main)] text-sm font-semibold transition-colors border border-[var(--border)] shadow-sm">
              Connect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: RotateCcw, title: "Replay Mistakes", desc: "Puzzles from your games" },
              { icon: Crown, title: "GM Puzzles", desc: "Grandmaster positions" },
              { icon: Upload, title: "Upload PGN", desc: "Analyze any game" }
            ].map((item, i) => (
              <div key={i} className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl p-6 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group shadow-lg shadow-black/5">
                <div className="flex items-start justify-between mb-4">
                   <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] group-hover:bg-[var(--accent)]/10 flex items-center justify-center transition-colors shrink-0 border border-[var(--border-soft)]">
                      <item.icon size={24} className="text-[var(--accent)]" />
                   </div>
                   <span className="text-[var(--text-muted)]/40 group-hover:text-[var(--accent)]">›</span>
                </div>
                <h4 className="font-display text-lg text-[var(--text-main)] mb-1">{item.title}</h4>
                <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-display text-[var(--text-main)]">Analyze Your Games</h3>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] transition-colors border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm">
                 <Upload size={18} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] transition-colors border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm">
                 <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-8">
             <button 
               onClick={() => setFilter("all")}
               className={`px-6 py-2 rounded-full text-sm font-semibold border transition-all ${filter === "all" ? "bg-[var(--accent)] text-[var(--bg-app)] border-[var(--accent)] shadow-md" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/50"}`}
             >
               All
             </button>
             <button 
               onClick={() => setFilter("bots")}
               className={`px-6 py-2 rounded-full text-sm font-semibold border transition-all ${filter === "bots" ? "bg-[var(--accent)] text-[var(--bg-app)] border-[var(--accent)] shadow-md" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/50"}`}
             >
               Bots
             </button>
          </div>

          {loadingGames ? (
            <div className="text-[var(--text-muted)] p-8 text-center italic">Loading your games...</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-[var(--text-muted)] p-12 bg-[var(--bg-sidebar)] rounded-3xl border border-[var(--border)] text-center italic">
              No games found for this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredGames.map((game) => {
                const isWin = game.result === "win";
                const isDraw = game.result === "draw";
                const resultColor = isWin ? "text-green-600 bg-green-50" : isDraw ? "text-[#7a6454] bg-[#ede8e0]" : "text-red-600 bg-red-50";
                const date = new Date(game.played_at);
                const relativeTime = getRelativeTime(date);
                
                return (
                  <div key={game.id} className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl p-6 shadow-xl shadow-black/5 hover:border-[var(--accent)]/20 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                        {game.platform === "chess.com" ? "Chess.com" : game.platform === "lichess" ? "Lichess" : "Blunder Therapist"}
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${resultColor} border border-current opacity-70`}>
                        {game.result}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4 mb-8 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-display text-lg text-[var(--text-main)] flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border-2 ${game.player_color === "white" ? "bg-white border-[var(--text-main)]/10" : "bg-[var(--text-main)] border-[var(--text-main)]"}`}></div>
                          {displayName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-display text-lg text-[var(--text-muted)] flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border-2 ${game.player_color === "black" ? "bg-white border-[var(--text-main)]/10" : "bg-[var(--text-main)] border-[var(--text-main)]"}`}></div>
                          {game.opponent_name || "Opponent"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-[var(--border-soft)] mt-auto">
                      <span className="text-xs font-medium text-[var(--text-muted)]">{relativeTime}</span>
                      <button className="px-6 py-2 rounded-xl bg-[var(--bg-card)] group-hover:bg-[var(--accent)] group-hover:text-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold transition-all border border-[var(--border)] shadow-sm">
                        Analyze
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 sticky top-10 h-auto lg:h-[calc(100vh-80px)] overflow-hidden">
        <DashboardAgent />
      </aside>

      {showImport && (
        <ImportGames
          onClose={() => setShowImport(false)}
          onDone={() => setShowImport(false)}
        />
      )}
    </div>
  );
}