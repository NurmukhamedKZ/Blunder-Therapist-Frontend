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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const created = await importApi.create(platform, username.trim(), periodDays);
      setJob(created);
      setStep("progress");
      
      stopPolling();
      
      const poll = async () => {
        try {
          const updated = await importApi.status(created.job_id);
          setJob(updated);
          if (updated.status === "done") {
            setStep("done");
            return; // stop polling
          } else if (updated.status === "failed") {
            setErrorMsg(updated.error ?? "Import failed");
            setStep("error");
            return; // stop polling
          }
        } catch {
          // transient poll error — keep polling
        }
        pollRef.current = setTimeout(poll, 1000);
      };
      
      pollRef.current = setTimeout(poll, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start import");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress =
    job && job.total_games > 0
      ? Math.round((job.processed_games / job.total_games) * 100)
      : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center border border-[var(--border)]">
              <Upload size={24} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-display text-[var(--text-main)]">Import Games</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 hover:bg-[var(--bg-card-hover)] rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-3 block">Platform</label>
              <div className="flex gap-2">
                {(["lichess", "chess.com"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      platform === p
                        ? "bg-[var(--accent)] text-[var(--bg-app)] border-[var(--accent)] shadow-md"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    {p === "lichess" ? "Lichess" : "Chess.com"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-3 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Your ${platform} username`}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-3 block">Period</label>
              <div className="flex gap-2">
                {([30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPeriodDays(d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      periodDays === d
                        ? "bg-[var(--accent)] text-[var(--bg-app)] border-[var(--accent)] shadow-md"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--bg-app)] font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20 mt-2"
            >
              {isSubmitting ? "Starting..." : "Import Games"}
            </button>
          </form>
        )}

        {step === "progress" && job && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex flex-col items-center gap-4 text-[var(--text-main)]">
              <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
              <span className="text-lg font-display">
                {job.total_games === 0
                  ? "Fetching games…"
                  : `Analyzing ${job.processed_games} / ${job.total_games} games`}
              </span>
            </div>
            {job.total_games > 0 && (
              <div className="w-full bg-[var(--bg-app)] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[var(--accent)] h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <p className="text-[var(--text-muted)] text-sm italic">
              Our AI is studying your move timing and evaluation patterns. This may take a minute.
            </p>
          </div>
        )}

        {step === "done" && job && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2 border border-green-500/20">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-[var(--text-main)] font-display text-2xl">
                {job.processed_games} games imported!
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                Your behavioral DNA has been updated with your {platform} history.
              </p>
            </div>
            <button
              onClick={onDone}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--bg-app)] font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10 mt-4"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <p className="text-[var(--text-main)] font-display text-2xl">Import failed</p>
              <p className="text-red-500/70 text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStep("form")}
              className="w-full py-4 rounded-xl bg-[var(--bg-sidebar)] text-[var(--text-main)] font-bold hover:bg-[var(--bg-app)] transition-all border border-[var(--border)] mt-4"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
