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
    
    const pawns = evaluation / 100;
    const prefix = pawns > 0 ? "+" : "";
    return `${prefix}${pawns.toFixed(1)}`;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[#2c1f14]/5 overflow-hidden shadow-inner">
      <div className="px-6 py-4 border-b border-[#2c1f14]/5 bg-white/80 backdrop-blur-sm shrink-0 flex justify-between items-center">
        <h3 className="font-display text-[#2c1f14] text-lg">Game History</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a6454] bg-[#f5f0ea] px-3 py-1 rounded-full border border-[#2c1f14]/5">
          {history.length} moves
        </span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {movePairs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[#7a6454]/40 text-sm italic">
            No moves played yet.
          </div>
        ) : (
          <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-2 gap-y-1 text-sm font-mono">
            {movePairs.map((pair) => (
              <div key={pair.moveNumber} className="contents group">
                <div className="py-2 px-2 text-right text-[#7a6454]/40 border-r border-[#2c1f14]/5 select-none flex items-center justify-end font-medium">
                  {pair.moveNumber}.
                </div>
                
                <div className="py-2 px-3 rounded-xl hover:bg-[#f5f0ea] transition-colors flex items-center justify-between group-hover:bg-[#f5f0ea]/50">
                  <span className="font-bold text-[#2c1f14]">{pair.white.san}</span>
                  <span className={clsx("text-[10px] font-bold", getEvalColor(pair.white.eval_after))}>
                    {formatEval(pair.white.eval_after)}
                  </span>
                </div>
                
                {pair.black ? (
                  <div className="py-2 px-3 rounded-xl hover:bg-[#f5f0ea] transition-colors flex items-center justify-between group-hover:bg-[#f5f0ea]/50">
                    <span className="font-bold text-[#2c1f14]">{pair.black.san}</span>
                    <span className={clsx("text-[10px] font-bold", getEvalColor(pair.black.eval_after))}>
                      {formatEval(pair.black.eval_after)}
                    </span>
                  </div>
                ) : (
                  <div className="py-2 px-3"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
