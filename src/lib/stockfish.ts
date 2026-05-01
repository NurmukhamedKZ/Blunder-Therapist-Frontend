/**
 * Stockfish wrapper.
 *
 * Stockfish runs as a Web Worker. We send UCI commands and parse responses.
 * For our needs we only care about:
 *   - "go depth N" -> get best move + eval
 *   - parsing "info ... score cp X" or "score mate Y"
 *
 * NOTE: We use stockfish.js NPM package which ships a worker file. If that
 * fails, fallback is to load from CDN: https://lichess1.org/assets/stockfish.js
 */

export interface StockfishEval {
  bestMove: string; // UCI format e.g. "e2e4"
  scoreCp: number; // centipawns from the side-to-move's POV
  mateIn: number | null; // positive = mating, negative = getting mated
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private resolvers: ((evalResult: StockfishEval) => void)[] = [];
  private currentBestMove = "";
  private currentScoreCp = 0;
  private currentMateIn: number | null = null;

  async init(): Promise<void> {
    // Lazy import - avoids SSR issues in Next.js
    if (typeof window === "undefined") return;
    try {
      // stockfish.js publishes the worker as a script
      this.worker = new Worker("/stockfish.js");
    } catch {
      // Fallback: inline stockfish loader from a CDN
      this.worker = new Worker(
        URL.createObjectURL(
          new Blob(
            [`importScripts('https://lichess1.org/assets/stockfish.js');`],
            { type: "application/javascript" }
          )
        )
      );
    }
    this.worker.onmessage = (e) => this.onMessage(e.data);
    this.send("uci");
    this.send("isready");
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage(line: string) {
    if (typeof line !== "string") return;

    if (line.startsWith("info ")) {
      // Parse "info ... score cp 35" or "score mate 3"
      const cpMatch = line.match(/score cp (-?\d+)/);
      const mateMatch = line.match(/score mate (-?\d+)/);
      if (cpMatch) {
        this.currentScoreCp = parseInt(cpMatch[1], 10);
        this.currentMateIn = null;
      }
      if (mateMatch) {
        this.currentMateIn = parseInt(mateMatch[1], 10);
      }
    }

    if (line.startsWith("bestmove ")) {
      const parts = line.split(" ");
      this.currentBestMove = parts[1];
      const resolver = this.resolvers.shift();
      if (resolver) {
        resolver({
          bestMove: this.currentBestMove,
          scoreCp: this.currentScoreCp,
          mateIn: this.currentMateIn,
        });
      }
    }
  }

  /** Get the engine's evaluation + best move for a position (FEN). */
  async evaluate(fen: string, depth: number = 12): Promise<StockfishEval> {
    return new Promise((resolve) => {
      this.resolvers.push(resolve);
      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /** Pick a move at a given skill level. Stockfish has a Skill Level option 0-20. */
  async pickMove(fen: string, skillLevel: number = 5): Promise<string> {
    return new Promise((resolve) => {
      this.send(`setoption name Skill Level value ${skillLevel}`);
      this.resolvers.push((result) => resolve(result.bestMove));
      this.send(`position fen ${fen}`);
      // Lower depth at lower skill = more "human-like" mistakes
      const depth = Math.max(2, Math.min(15, Math.floor(skillLevel * 0.8) + 2));
      this.send(`go depth ${depth}`);
    });
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
  }
}
