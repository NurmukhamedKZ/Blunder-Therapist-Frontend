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
import { api, type AnalyzeGameRequest, type TiltDetectorResponse } from "@/lib/api";
import { TiltReport } from "./TiltReport";

type Status = "playing" | "white-wins" | "black-wins" | "draw";

export function ChessGame() {
  const gameRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  // We track per-ply data in refs so they don't trigger re-renders
  const evalPerPlyRef = useRef<number[]>([]);
  const timePerPlyRef = useRef<number[]>([]);
  const lastMoveStartRef = useRef<number>(Date.now());

  const [fen, setFen] = useState(gameRef.current.fen());
  const [status, setStatus] = useState<Status>("playing");
  const [thinking, setThinking] = useState(false);
  const [skillLevel, setSkillLevel] = useState(5); // 0=easy, 20=master
  const [analysis, setAnalysis] = useState<TiltDetectorResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

    // Evaluate position with Stockfish for our records
    if (engineRef.current) {
      const ev = await engineRef.current.evaluate(gameRef.current.fen(), 10);
      // Stockfish gives eval from side-to-MOVE perspective. We always store
      // from White's perspective so the backend math is consistent.
      // After my move, side-to-move is opponent. Flip sign accordingly.
      const fromWhitePOV =
        gameRef.current.turn() === "w" ? ev.scoreCp : -ev.scoreCp;
      // Mate scoring: clamp to a big number with sign
      const mateAdjusted =
        ev.mateIn != null
          ? ev.mateIn > 0
            ? 9999 * (gameRef.current.turn() === "w" ? 1 : -1)
            : -9999 * (gameRef.current.turn() === "w" ? 1 : -1)
          : fromWhitePOV;
      evalPerPlyRef.current.push(mateAdjusted);
    }

    if (gameRef.current.isGameOver()) {
      const newStatus = computeStatus();
      setStatus(newStatus);
      // Auto-trigger analysis on game end
      void runAnalysis(newStatus);
    } else if (gameRef.current.turn() === "b") {
      // Engine's turn
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
      };
      const r = await api.analyzeGame(req);
      setAnalysis(r);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    gameRef.current = new Chess();
    evalPerPlyRef.current = [];
    timePerPlyRef.current = [];
    lastMoveStartRef.current = Date.now();
    setFen(gameRef.current.fen());
    setStatus("playing");
    setAnalysis(null);
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
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium"
          >
            New game
          </button>
        </div>
      </div>

      <aside className="flex-1 lg:max-w-md">
        {analyzing && (
          <div className="rounded-2xl bg-ink-700 p-6 animate-pulse">
            Analyzing your decision patterns…
          </div>
        )}
        {analysis && <TiltReport report={analysis} />}
        {!analysis && !analyzing && (
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6">
            <h2 className="font-display text-xl mb-2">After this game...</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              We&apos;ll analyze not just your moves, but how you made them — your
              thinking time, the moments you panicked, the patterns you keep
              repeating. Most chess sites tell you what to play. We tell you{" "}
              <em>why you played it</em>.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
