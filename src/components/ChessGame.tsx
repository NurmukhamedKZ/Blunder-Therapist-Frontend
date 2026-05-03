"use client";

/**
 * Main playable chess UI.
 *
 * Responsibilities:
 *   1. Render the board (react-chessboard v5 with new `options` API)
 *   2. Validate moves (chess.js)
 *   3. Run Stockfish opponent in a Web Worker
 *   4. Record per-ply: SAN, eval, thinking time
 *   5. On game end, send everything to /api/analyze-game
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { StockfishEngine } from "@/lib/stockfish";
import { api, agentApi, type AnalyzeGameRequest, type TiltDetectorResponse } from "@/lib/api";
import { classifyPly } from "@/lib/event-detector";
import { TiltReport } from "./TiltReport";
import { AgentChat } from "./AgentChat";
import { MoveList } from "./MoveList";
import { useTheme } from "@/components/ThemeProvider";

type Status = "playing" | "white-wins" | "black-wins" | "draw";

export function ChessGame() {
  const { theme } = useTheme();
  const [gameId, setGameId] = useState<string>(() => crypto.randomUUID());

  const gameRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  // We track per-ply data in refs so they don't trigger re-renders
  const evalPerPlyRef = useRef<number[]>([]);
  const timePerPlyRef = useRef<number[]>([]);
  const lastMoveStartRef = useRef<number>(Date.now());
  const prevEvalRef = useRef<number>(0);
  const lastObservePlyRef = useRef<number>(0);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [status, setStatus] = useState<Status>("playing");
  const [thinking, setThinking] = useState(false);
  const [skillLevel, setSkillLevel] = useState(5); // 0=easy, 20=master
  const [analysis, setAnalysis] = useState<TiltDetectorResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<Array<{ ply: number; san: string; eval_after: number; time_sec: number }>>([]);
  const [lastObservation, setLastObservation] = useState<{
    event: "blunder";
    payload: any;
    timestamp: number;
  } | null>(null);

  // Initialize Stockfish once
  useEffect(() => {
    const engine = new StockfishEngine();
    engine.init();
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  /** After every move (mine or engine's), evaluate + check game over. */
  async function afterMove(thinkingMs: number) {
    timePerPlyRef.current.push(thinkingMs / 1000);
    setFen(gameRef.current.fen());

    if (gameRef.current.isGameOver()) {
      const newStatus = computeStatus();
      setStatus(newStatus);

      // Record final eval manually to avoid engine hang on terminal position
      let finalEval = prevEvalRef.current;
      if (gameRef.current.isCheckmate()) {
        finalEval = gameRef.current.turn() === "b" ? 9999 : -9999;
      } else if (gameRef.current.isDraw()) {
        finalEval = 0;
      }
      evalPerPlyRef.current.push(finalEval);
      prevEvalRef.current = finalEval;

      void runAnalysis(newStatus);
      return;
    }

    if (engineRef.current) {
      const ev = await engineRef.current.evaluate(gameRef.current.fen(), 10);
      const fromWhitePOV =
        gameRef.current.turn() === "w" ? ev.scoreCp : -ev.scoreCp;
      const mateAdjusted =
        ev.mateIn != null
          ? ev.mateIn > 0
            ? 9999 * (gameRef.current.turn() === "w" ? 1 : -1)
            : -9999 * (gameRef.current.turn() === "w" ? 1 : -1)
          : fromWhitePOV;
      const evalBefore = prevEvalRef.current;
      evalPerPlyRef.current.push(mateAdjusted);
      prevEvalRef.current = mateAdjusted;

      // The ply we just recorded was made by the side OPPOSITE to current turn.
      const playerJustMoved = gameRef.current.turn() === "w" ? "black" : "white";
      if (playerJustMoved === "white") {
        const evt = classifyPly(evalBefore, mateAdjusted, "white");
        if (evt === "blunder") {
          const currentPlyIdx = evalPerPlyRef.current.length - 1;
          const allHistory = gameRef.current.history();
          const lastSan = allHistory[currentPlyIdx] ?? "";
          const time = timePerPlyRef.current[currentPlyIdx] ?? 0;

          const movesSince = allHistory
            .slice(lastObservePlyRef.current, currentPlyIdx + 1)
            .map((san, i) => {
              const idx = lastObservePlyRef.current + i;
              return {
                ply: idx,
                san,
                eval_after: evalPerPlyRef.current[idx] ?? 0,
                time_sec: timePerPlyRef.current[idx] ?? 0,
              };
            });

          lastObservePlyRef.current = currentPlyIdx + 1;

          setLastObservation({
            event: "blunder",
            payload: {
              ply: currentPlyIdx,
              san: lastSan,
              eval_before: evalBefore,
              eval_after: mateAdjusted,
              time_taken: time,
              moves_since_last_observe: movesSince,
            },
            timestamp: Date.now(),
          });
        }
      }
    }

    if (gameRef.current.turn() === "b") {
      void engineMove();
    }

    // Update live history for the MoveList
    setGameHistory(
      gameRef.current.history().map((san, i) => ({
        ply: i,
        san,
        eval_after: evalPerPlyRef.current[i] ?? 0,
        time_sec: timePerPlyRef.current[i] ?? 0,
      }))
    );
  }

  function computeStatus(): Status {
    if (gameRef.current.isDraw()) return "draw";
    if (gameRef.current.isCheckmate()) {
      return gameRef.current.turn() === "w" ? "black-wins" : "white-wins";
    }
    return "draw"; // stalemate, etc
  }

  /** Drop handler for the board. Returns false to reject illegal moves. */
  function handlePieceDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (status !== "playing" || gameRef.current.turn() !== "w") return false;
    if (!targetSquare) return false;
    try {
      const move = gameRef.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (!move) return false;
    } catch {
      return false;
    }
    const elapsed = Date.now() - lastMoveStartRef.current;
    void afterMove(elapsed);
    return true;
  }

  async function engineMove() {
    if (!engineRef.current) return;
    setThinking(true);
    const start = Date.now();
    const uciMove = await engineRef.current.pickMove(
      gameRef.current.fen(),
      skillLevel
    );
    setThinking(false);

    // Apply the engine's move
    try {
      gameRef.current.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove.length > 4 ? uciMove[4] : undefined,
      });
    } catch {
      // If parse fails, just bail silently
      return;
    }
    const elapsed = Date.now() - start;
    await afterMove(elapsed);
    lastMoveStartRef.current = Date.now(); // reset clock for human's next move
  }

  async function runAnalysis(finalStatus: Status) {
    if (analyzing || analysis) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result =
        finalStatus === "white-wins"
          ? "win"
          : finalStatus === "black-wins"
            ? "loss"
            : "draw";
      const req: AnalyzeGameRequest = {
        pgn: gameRef.current.pgn(),
        eval_per_ply: evalPerPlyRef.current,
        time_per_ply: timePerPlyRef.current,
        player_color: "white",
        result,
        client_game_id: gameId,
      };
      const history = gameRef.current.history();
      setGameHistory(
        history.map((san, i) => ({
          ply: i,
          san,
          eval_after: evalPerPlyRef.current[i] ?? 0,
          time_sec: timePerPlyRef.current[i] ?? 0,
        })),
      );
      const r = await api.analyzeGame(req);
      setAnalysis(r);
    } catch (e) {
      console.error(e);
      setAnalysisError(e instanceof Error ? e.message : "Analysis failed. Check that you are logged in and the server is running.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    agentApi.closeSession(gameId).catch(() => {});
    gameRef.current = new Chess();
    evalPerPlyRef.current = [];
    timePerPlyRef.current = [];
    prevEvalRef.current = 0;
    lastMoveStartRef.current = Date.now();
    lastObservePlyRef.current = 0;
    setFen(gameRef.current.fen());
    setStatus("playing");
    setAnalysis(null);
    setAnalysisError(null);
    setLastObservation(null);
    setGameHistory([]);
    setGameId(crypto.randomUUID());
  }

  function resign() {
    if (status !== "playing") return;
    const newStatus = "black-wins";
    setStatus(newStatus);
    void runAnalysis(newStatus);
  }

  function testWin() {
    if (status !== "playing") return;
    // Set a position near mate where white can deliver it in one move
    // White: Ka6, Qh1; Black: Ka8
    gameRef.current.load("k7/8/K7/8/8/8/8/7Q w - - 0 1");
    // Deliver mate to ensure there is at least one move in the history
    gameRef.current.move("Qa8#");
    setFen(gameRef.current.fen());
    void afterMove(0);
  }

  const boardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop: handlePieceDrop,
      boardOrientation: "white" as const,
      darkSquareStyle: { backgroundColor: theme === "light" ? "#b58863" : "#a07a58" },
      lightSquareStyle: { backgroundColor: theme === "light" ? "#f0d9b5" : "#decba4" },
    }),
    [fen, theme]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full p-4 lg:p-10 mx-auto max-w-[1600px] items-stretch bg-[var(--bg-app)]">
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 w-full">
        <div className="w-full max-w-[700px] shrink-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border-[12px] border-[var(--board-frame)] transition-colors">
          <Chessboard options={boardOptions} />
        </div>

        <div className="w-full max-w-[700px] mt-8 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-6 text-sm bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl shadow-black/5">
            <label className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Opponent Strength</label>
            <input
              type="range"
              min={0}
              max={20}
              value={skillLevel}
              onChange={(e) => setSkillLevel(parseInt(e.target.value))}
              disabled={status !== "playing" && gameRef.current.history().length > 0}
              className="flex-1 accent-[var(--accent)] h-1.5 bg-[var(--bg-app)] rounded-full appearance-none cursor-pointer"
            />
            <span className="font-display w-10 text-right text-[var(--text-main)] font-bold text-xl">{skillLevel}</span>
          </div>

          <div className="flex items-center justify-between bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl shadow-black/5">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Game Status</span>
                <span className="text-xl font-display text-[var(--text-main)]">
                  {thinking
                    ? "Coach is thinking..."
                    : status === "playing"
                      ? "Your Turn"
                      : status === "white-wins"
                        ? "Victory!"
                        : status === "black-wins"
                          ? "Defeat"
                          : "Draw"}
                </span>
              </div>
              {status === "playing" && (
                <button
                  onClick={testWin}
                  className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-[var(--bg-app)] hover:opacity-80 text-[var(--text-muted)] transition-all ml-2"
                  title="Debug: Force a winning position"
                >
                  Test Win
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {status === "playing" && (
                <button
                  onClick={resign}
                  className="px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold transition-all"
                >
                  Resign
                </button>
              )}
              <button
                onClick={reset}
                className="px-8 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--bg-app)] text-sm font-bold transition-all shadow-lg shadow-black/10"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col gap-6 h-[800px] lg:h-auto lg:min-h-0">
        {analysisError && !analyzing && (
          <div className="rounded-3xl bg-red-50 border border-red-100 p-6 shrink-0 shadow-lg shadow-red-500/5">
            <p className="text-red-600 text-sm font-bold mb-2">Analysis failed</p>
            <p className="text-red-600/60 text-xs leading-relaxed mb-4">{analysisError}</p>
            <button
              onClick={() => runAnalysis(status)}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
            >
              Retry Analysis
            </button>
          </div>
        )}
        <div className="flex-[3] min-h-0 overflow-hidden shadow-2xl shadow-black/5 rounded-3xl bg-[var(--bg-card)] p-2">
          <AgentChat
            threadId={gameId}
            tiltReport={analysis}
            lastObservation={lastObservation}
            gameHistory={gameHistory}
          />
        </div>
        <div className="flex-[2] min-h-0 overflow-hidden shadow-2xl shadow-black/5 rounded-3xl bg-[var(--bg-card)] p-2">
          <MoveList history={gameHistory} />
        </div>
      </aside>
    </div>
  );
}
