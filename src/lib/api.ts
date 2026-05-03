import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...auth },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export interface AnalyzeGameRequest {
  pgn: string;
  eval_per_ply: number[];
  time_per_ply: number[];
  player_color: "white" | "black";
  result: "win" | "loss" | "draw";
  client_game_id?: string;
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



export interface GameSummary {
  id: string;
  player_color: string;
  result: string;
  played_at: string;
  tilt_report: TiltDetectorResponse | null;
  opponent_name: string | null;
  platform: string | null;
}

export interface GameListResponse {
  games: GameSummary[];
  total: number;
}

export const api = {
  analyzeGame: (req: AnalyzeGameRequest) =>
    post<TiltDetectorResponse>("/api/analyze-game", req),

  decisionDNA: (n = 5) =>
    post<DecisionDNAResponse>("/api/decision-dna", { n }),

  coachChat: (message: string, history: ChatTurn[]) =>
    post<{ reply: string }>("/api/coach", { message, history }),

  listGames: (page = 1) =>
    get<GameListResponse>(`/api/games?page=${page}`),

  getGame: (id: string) =>
    get<GameSummary>(`/api/games/${id}`),
};


export interface AgentHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

async function postStream(path: string, body: unknown): Promise<Response> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res;
}

export const agentApi = {
  observe: (thread_id: string, event: "game_start" | "blunder" | "game_end",
            payload: Record<string, unknown> = {}) =>
    postStream("/api/agent/observe", { thread_id, event, payload }),

  message: (thread_id: string, text: string) =>
    postStream("/api/agent/message", { thread_id, text }),

  closeSession: async (thread_id: string) => {
    const auth = await getAuthHeaders();
    return fetch(`${API_BASE}/api/agent/close-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ thread_id }),
      keepalive: true,
    });
  },

  history: (thread_id: string) =>
    get<{ messages: AgentHistoryMessage[] }>(`/api/agent/history/${thread_id}`),
};


// ---------- Import API ----------

export interface ImportJobStatus {
  job_id: string;
  status: "pending" | "running" | "done" | "failed";
  total_games: number;
  processed_games: number;
  error: string | null;
  finished_at: string | null;
}

export const importApi = {
  create: (platform: "chess.com" | "lichess", username: string, period_days: 30 | 90) =>
    post<ImportJobStatus>("/api/import", { platform, username, period_days }),

  status: (job_id: string) =>
    get<ImportJobStatus>(`/api/import/${job_id}`),

  list: () =>
    get<{ jobs: ImportJobStatus[] }>("/api/import"),
};