// frontend/src/lib/agent-stream.ts
export type AgentStreamEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function* parseAgentStream(
  response: Response,
): AsyncIterable<AgentStreamEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }

      if (event === "token" && data) {
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed.text === "string") {
            yield { type: "token", text: parsed.text };
          }
        } catch {
          // skip malformed
        }
      } else if (event === "done") {
        yield { type: "done" };
      } else if (event === "error") {
        try {
          const parsed = JSON.parse(data || "{}");
          yield { type: "error", message: parsed.message ?? "agent error" };
        } catch {
          yield { type: "error", message: "agent error" };
        }
      }
    }
  }
}