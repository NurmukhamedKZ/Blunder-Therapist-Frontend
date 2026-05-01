// frontend/src/lib/event-detector.ts
export const BLUNDER_THRESHOLD_CP = 200;

export function classifyPly(
  evalBefore: number,
  evalAfter: number,
  playerColor: "white" | "black",
): "blunder" | null {
  const delta = evalAfter - evalBefore;
  if (playerColor === "white" && delta <= -BLUNDER_THRESHOLD_CP) return "blunder";
  if (playerColor === "black" && delta >= BLUNDER_THRESHOLD_CP) return "blunder";
  return null;
}