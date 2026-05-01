/**
 * Typed client for the Blunder Therapist FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface AnalyzeGameRequest {
  pgn: string;
  eval_per_ply: number[];
  time_per_ply: number[];
  player_color: "white" | "black";
  result: "win" | "loss" | "draw";
}

export interface TiltDetectorResponse {
  headline: string;
  diagnosis: string;
  pattern_label: string;
  evidence_plies: number[];
  suggestion: string;
}

export interface DecisionDNAResponse {
  type_name: string;
  tagline: string;
  summary: string;
  core_strength: string;
  core_weakness: string;
  gm_comparison: { name: string; similarity_pct: number; why: string };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const api = {
  analyzeGame: (req: AnalyzeGameRequest) =>
    post<TiltDetectorResponse>("/api/analyze-game", req),

  decisionDNA: (games: AnalyzeGameRequest[]) =>
    post<DecisionDNAResponse>("/api/decision-dna", { games }),

  coachChat: (
    message: string,
    history: ChatTurn[],
    recentGames: AnalyzeGameRequest[]
  ) =>
    post<{ reply: string }>("/api/coach", {
      message,
      history,
      recent_games: recentGames,
    }),
};
