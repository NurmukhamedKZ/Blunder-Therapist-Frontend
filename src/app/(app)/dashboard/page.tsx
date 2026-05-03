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
    <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-10 max-w-[1600px] mx-auto w-full items-start">
      <div className="flex-1 min-w-0 w-full">
        <header className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center shrink-0 border border-accent-500/30">
            <UserIcon size={32} className="text-accent-500" />
          </div>
          <div>
            <p className="text-ink-400 text-sm mb-1">Good evening,</p>
            <h2 className="text-3xl lg:text-4xl font-display text-white">
              {displayName}
            </h2>
          </div>
          <button className="ml-auto px-4 py-2 rounded-full bg-white text-ink-900 font-bold text-sm hover:bg-ink-200 transition-colors">
            Upgrade
          </button>
        </header>

        <section className="mb-8">
          <Link 
            href="/play"
            className="group block bg-ink-800 border border-ink-700 rounded-2xl p-6 hover:bg-ink-700 transition-all hover:border-ink-600 shadow-lg shadow-black/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-ink-700 group-hover:bg-ink-600 flex items-center justify-center transition-colors shrink-0 shadow-inner">
                  <Swords size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Play Now</h3>
                  <p className="text-ink-400 text-sm">Bots or online opponents</p>
                </div>
              </div>
              <div className="px-6 py-2.5 rounded-xl bg-ink-700 group-hover:bg-accent-500 group-hover:text-white transition-colors text-sm font-medium self-start sm:self-auto shadow-sm">
                Play
              </div>
            </div>
          </Link>

          <button
            onClick={() => setShowImport(true)}
            className="group mt-3 flex w-full items-center gap-4 bg-ink-800 border border-ink-700 rounded-2xl p-6 hover:bg-ink-700 transition-all hover:border-ink-600 shadow-lg shadow-black/20 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-ink-700 group-hover:bg-ink-600 flex items-center justify-center transition-colors shrink-0 shadow-inner">
              <Upload size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Import Games</h3>
              <p className="text-ink-400 text-sm">Analyze your Chess.com or Lichess history</p>
            </div>
          </button>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-ink-800/50 border border-ink-700/50 rounded-xl overflow-hidden">
            <div className="text-ink-400 text-sm flex flex-1 items-center gap-2 truncate">
              <span>🔗</span>
              <span className="truncate"><strong>Connect Lichess</strong> to play online against real opponents</span>
            </div>
            <button className="shrink-0 px-4 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm font-medium transition-colors border border-ink-600">
              Connect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 hover:bg-ink-700 transition-colors cursor-pointer group shadow-md shadow-black/10">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-10 h-10 rounded-lg bg-ink-700 group-hover:bg-ink-600 flex items-center justify-center transition-colors shrink-0 border border-ink-600">
                    <RotateCcw size={20} className="text-white" />
                 </div>
                 <span className="text-ink-500 group-hover:text-ink-400">›</span>
              </div>
              <h4 className="font-semibold text-white mb-1">Replay Mistakes</h4>
              <p className="text-xs text-ink-400">Puzzles from your games</p>
            </div>

            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 hover:bg-ink-700 transition-colors cursor-pointer group shadow-md shadow-black/10">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-10 h-10 rounded-lg bg-ink-700 group-hover:bg-ink-600 flex items-center justify-center transition-colors shrink-0 border border-ink-600">
                    <Crown size={20} className="text-white" />
                 </div>
                 <span className="text-ink-500 group-hover:text-ink-400">›</span>
              </div>
              <h4 className="font-semibold text-white mb-1">GM Puzzles</h4>
              <p className="text-xs text-ink-400">Grandmaster positions</p>
            </div>

            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 hover:bg-ink-700 transition-colors cursor-pointer group shadow-md shadow-black/10">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-10 h-10 rounded-lg bg-ink-700 group-hover:bg-ink-600 flex items-center justify-center transition-colors shrink-0 border border-ink-600">
                    <Upload size={20} className="text-white" />
                 </div>
                 <span className="text-ink-500 group-hover:text-ink-400">›</span>
              </div>
              <h4 className="font-semibold text-white mb-1">Upload PGN</h4>
              <p className="text-xs text-ink-400">Analyze any game</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display text-white">Analyze Your Games</h3>
            <div className="flex gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-ink-800 hover:bg-ink-700 transition-colors border border-ink-700 text-ink-400 hover:text-white">
                 <Upload size={16} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-ink-800 hover:bg-ink-700 transition-colors border border-ink-700 text-ink-400 hover:text-white">
                 <RotateCcw size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <button 
               onClick={() => setFilter("all")}
               className={`px-5 py-1.5 rounded-full text-sm font-medium border shadow-sm transition-colors ${filter === "all" ? "bg-ink-700 text-white border-ink-600" : "bg-ink-800 text-ink-400 border-ink-700 hover:text-white hover:bg-ink-700"}`}
             >
               All
             </button>
             <button 
               onClick={() => setFilter("bots")}
               className={`px-5 py-1.5 rounded-full text-sm font-medium border shadow-sm transition-colors ${filter === "bots" ? "bg-ink-700 text-white border-ink-600" : "bg-ink-800 text-ink-400 border-ink-700 hover:text-white hover:bg-ink-700"}`}
             >
               Bots
             </button>
          </div>

          {loadingGames ? (
            <div className="text-ink-400 p-4">Loading your games...</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-ink-400 p-4 bg-ink-800 rounded-xl border border-ink-700">
              No games found for this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredGames.map((game) => {
                const isWin = game.result === "win";
                const isDraw = game.result === "draw";
                const resultColor = isWin ? "text-signal-green bg-signal-green/10" : isDraw ? "text-ink-400 bg-ink-700" : "text-signal-red bg-signal-red/10";
                const date = new Date(game.played_at);
                const relativeTime = getRelativeTime(date);
                
                return (
                  <div key={game.id} className="bg-ink-800 border border-ink-700 rounded-2xl p-5 shadow-sm shadow-black/10 hover:border-ink-600 transition-colors flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-xs text-ink-400 flex items-center gap-2 font-medium">
                        <span className="text-ink-300">
                          {game.platform === "chess.com" ? "Chess.com" : game.platform === "lichess" ? "Lichess" : "Blunder.Therapist"}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${resultColor}`}>
                        {game.result}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mb-6 flex-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-white flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm border ${game.player_color === "white" ? "bg-white border-ink-400" : "bg-ink-900 border-ink-600"}`}></div>
                          {displayName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-ink-400 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm border ${game.player_color === "black" ? "bg-white border-ink-400" : "bg-ink-900 border-ink-600"}`}></div>
                          {game.opponent_name || "Opponent"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-ink-500 pt-4 border-t border-ink-700 mt-auto">
                      <span className="font-medium text-ink-400">{relativeTime}</span>
                      <button className="px-4 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-white font-medium transition-colors border border-ink-600 shadow-sm">
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