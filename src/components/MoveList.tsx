"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

interface Move {
  ply: number;
  san: string;
  eval_after?: number;
  time_sec?: number;
}

interface MoveListProps {
  history: Move[];
}

export function MoveList({ history }: MoveListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves by pairs
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [history]);

  function getEvalColor(evaluation?: number) {
    if (evaluation === undefined) return "text-ink-500";
    if (evaluation > 1) return "text-white";
    if (evaluation < -1) return "text-white";
    return "text-ink-400";
  }

  function formatEval(evaluation?: number) {
    if (evaluation === undefined) return "";
    // If it's a mate, eval might be very high (e.g. 9999)
    if (evaluation > 9000) return "+M";
    if (evaluation < -9000) return "-M";
    const prefix = evaluation > 0 ? "+" : "";
    return `${prefix}${evaluation.toFixed(1)}`;
  }

  return (
    <div className="flex flex-col h-full bg-ink-800 rounded-2xl border border-ink-600 overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-700 bg-ink-800/80 backdrop-blur-sm shrink-0 flex justify-between items-center">
        <h3 className="font-display text-white font-medium">Game History</h3>
        <span className="text-xs text-ink-500 bg-ink-900 px-2 py-1 rounded-md">
          {history.length} moves
        </span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 scroll-smooth">
        {movePairs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-ink-500 text-sm italic">
            No moves played yet.
          </div>
        ) : (
          <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-2 gap-y-1 text-sm font-mono">
            {movePairs.map((pair) => (
              <div key={pair.moveNumber} className="contents group">
                <div className="py-1.5 px-2 text-right text-ink-500 border-r border-ink-700/50 select-none flex items-center justify-end">
                  {pair.moveNumber}.
                </div>
                
                <div className="py-1.5 px-3 rounded hover:bg-ink-700 transition-colors flex items-center justify-between group-hover:bg-ink-700/50">
                  <span className="font-medium text-ink-200">{pair.white.san}</span>
                  <span className={clsx("text-[10px]", getEvalColor(pair.white.eval_after))}>
                    {formatEval(pair.white.eval_after)}
                  </span>
                </div>
                
                {pair.black ? (
                  <div className="py-1.5 px-3 rounded hover:bg-ink-700 transition-colors flex items-center justify-between group-hover:bg-ink-700/50">
                    <span className="font-medium text-ink-200">{pair.black.san}</span>
                    <span className={clsx("text-[10px]", getEvalColor(pair.black.eval_after))}>
                      {formatEval(pair.black.eval_after)}
                    </span>
                  </div>
                ) : (
                  <div className="py-1.5 px-3"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
