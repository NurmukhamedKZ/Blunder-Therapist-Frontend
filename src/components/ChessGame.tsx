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

type Status = "playing" | "white-wins" | "black-wins" | "draw";

export function ChessGame() {
  const [gameId, setGameId] = useState<string>(() => crypto.randomUUID());

  const gameRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  // We track per-ply data in refs so they don't trigger re-renders
  const evalPerPlyRef = useRef<number[]>([]);
  const timePerPlyRef = useRef<number[]>([]);
  const lastMoveStartRef = useRef<number>(Date.now());
  const prevEvalRef = useRef<number>(0);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [status, setStatus] = useState<Status>("playing");
  const [thinking, setThinking] = useState(false);
  const [skillLevel, setSkillLevel] = useState(5); // 0=easy, 20=master
  const [analysis, setAnalysis] = useState<TiltDetectorResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
          const ply = evalPerPlyRef.current.length;
          const lastSan = gameRef.current.history().slice(-1)[0] ?? "";
          const time = timePerPlyRef.current.slice(-1)[0] ?? 0;
          void agentApi
            .observe(gameId, "blunder", {
              ply,
              san: lastSan,
              eval_before: evalBefore,
              eval_after: mateAdjusted,
              time_taken: time,
            })
            .then(async (r) => {
              const reader = r.body?.getReader();
              while (reader && !(await reader.read()).done) {}
            });
        }
      }
    }

    if (gameRef.current.turn() === "b") {
      void engineMove();
    }
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
    setFen(gameRef.current.fen());
    setStatus("playing");
    setAnalysis(null);
    setAnalysisError(null);
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
      darkSquareStyle: { backgroundColor: "#3a3a4f" },
      lightSquareStyle: { backgroundColor: "#d6d6e0" },
    }),
    [fen]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto p-6">
      <div className="flex-1 max-w-[600px]">
        <Chessboard options={boardOptions} />

        <div className="mt-4 flex items-center gap-3 text-sm">
          <label className="text-ink-500">Opponent strength:</label>
          <input
            type="range"
            min={0}
            max={20}
            value={skillLevel}
            onChange={(e) => setSkillLevel(parseInt(e.target.value))}
            disabled={status !== "playing" && gameRef.current.history().length > 0}
            className="flex-1"
          />
          <span className="font-mono w-8 text-right">{skillLevel}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-ink-500">
              {thinking
                ? "Engine thinking..."
                : status === "playing"
                  ? "Your move"
                  : status === "white-wins"
                    ? "🎉 You won!"
                    : status === "black-wins"
                      ? "💀 Lost"
                      : "🤝 Draw"}
            </span>
            {status === "playing" && (
              <button
                onClick={testWin}
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-ink-700 hover:bg-ink-600 text-ink-400 transition-colors"
                title="Debug: Force a winning position"
              >
                Test Win
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {status === "playing" && (
              <button
                onClick={resign}
                className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-100 text-sm font-medium border border-ink-600 transition-colors"
              >
                Resign
              </button>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium transition-colors"
            >
              New game
            </button>
          </div>
        </div>
      </div>

      <aside className="flex-1 lg:max-w-md">
        {analysisError && !analyzing && (
          <div className="rounded-2xl bg-ink-700 border border-signal-red p-4 mb-3">
            <p className="text-signal-red text-sm font-medium mb-1">Analysis failed</p>
            <p className="text-ink-500 text-xs leading-relaxed">{analysisError}</p>
            <button
              onClick={() => runAnalysis(status)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}
        <AgentChat threadId={gameId} tiltReport={analysis} />
      </aside>
    </div>
  );
}
