import { ChessGame } from "@/components/ChessGame";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  return (
    <main>
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <NavBar />
        <div className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-accent-500 mb-3">
            A new kind of chess
          </p>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-4">
            Stop blaming the move.
            <br />
            <span className="text-accent-500">Start understanding the moment.</span>
          </h2>
          <p className="text-ink-500 leading-relaxed">
            Every chess platform tells you what you played wrong. We tell you{" "}
            <em>why</em>. Play a game — we&apos;ll show you the pattern in your
            decision-making the engine can&apos;t see.
          </p>
        </div>
      </header>

      <section id="play" className="pt-4 pb-20">
        <ChessGame />
      </section>
    </main>
  );
}