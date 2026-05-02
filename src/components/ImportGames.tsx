"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { importApi, ImportJobStatus } from "@/lib/api";

interface ImportGamesProps {
  onClose: () => void;
  onDone: () => void;
}

type Step = "form" | "progress" | "done" | "error";

export default function ImportGames({ onClose, onDone }: ImportGamesProps) {
  const [platform, setPlatform] = useState<"chess.com" | "lichess">("lichess");
  const [username, setUsername] = useState("");
  const [periodDays, setPeriodDays] = useState<30 | 90>(30);
  const [step, setStep] = useState<Step>("form");
  const [job, setJob] = useState<ImportJobStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const created = await importApi.create(platform, username.trim(), periodDays);
      setJob(created);
      setStep("progress");
      pollRef.current = setInterval(async () => {
        try {
          const updated = await importApi.status(created.job_id);
          setJob(updated);
          if (updated.status === "done") {
            stopPolling();
            setStep("done");
          } else if (updated.status === "failed") {
            stopPolling();
            setErrorMsg(updated.error ?? "Import failed");
            setStep("error");
          }
        } catch {
          // transient poll error — keep polling
        }
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start import");
      setStep("error");
    }
  };

  const progress =
    job && job.total_games > 0
      ? Math.round((job.processed_games / job.total_games) * 100)
      : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
              <Upload size={20} className="text-accent-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">Import Games</h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-ink-400 text-sm mb-2 block">Platform</label>
              <div className="flex gap-2">
                {(["lichess", "chess.com"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      platform === p
                        ? "bg-accent-500 text-white border-accent-500"
                        : "bg-ink-700 text-ink-300 border-ink-600 hover:bg-ink-600"
                    }`}
                  >
                    {p === "lichess" ? "Lichess" : "Chess.com"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-ink-400 text-sm mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Your ${platform} username`}
                className="w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-2.5 text-white placeholder-ink-500 focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-ink-400 text-sm mb-2 block">Period</label>
              <div className="flex gap-2">
                {([30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPeriodDays(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      periodDays === d
                        ? "bg-accent-500 text-white border-accent-500"
                        : "bg-ink-700 text-ink-300 border-ink-600 hover:bg-ink-600"
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3 rounded-xl bg-accent-500 text-white font-semibold hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Import games
            </button>
          </form>
        )}

        {step === "progress" && job && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-ink-300">
              <Loader2 size={18} className="animate-spin text-accent-500 shrink-0" />
              <span className="text-sm">
                {job.total_games === 0
                  ? "Fetching games…"
                  : `Analyzing ${job.processed_games} / ${job.total_games} games`}
              </span>
            </div>
            {job.total_games > 0 && (
              <div className="w-full bg-ink-700 rounded-full h-2">
                <div
                  className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <p className="text-ink-500 text-xs">
              Each game is evaluated by Stockfish — this may take a few minutes.
            </p>
          </div>
        )}

        {step === "done" && job && (
          <div className="space-y-4 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <p className="text-white font-semibold text-lg">
              {job.processed_games} game{job.processed_games !== 1 ? "s" : ""} imported!
            </p>
            <p className="text-ink-400 text-sm">
              The AI coach now has access to your {platform} history.
            </p>
            <button
              onClick={onDone}
              className="w-full py-3 rounded-xl bg-accent-500 text-white font-semibold hover:bg-accent-400 transition-colors"
            >
              View games
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <p className="text-white font-semibold">Import failed</p>
            <p className="text-ink-400 text-sm">{errorMsg}</p>
            <button
              onClick={() => setStep("form")}
              className="w-full py-3 rounded-xl bg-ink-700 text-white font-semibold hover:bg-ink-600 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
