import type { Mode } from "./types";

export function buildPrompt(text: string, mode?: Mode) {
  const instruction =
    mode === "bullets"
      ? "Summarize the transcript into clear bullet points. Keep it concise."
      : mode === "actions"
      ? "Extract concrete action items. Use a checklist format."
      : "Write a concise executive summary of the transcript.";

  return `${instruction}

Rules:
- Be accurate; do not invent details.
- Keep output under ~12 lines unless necessary.
- Use clear formatting.
- If the transcript has section headings or questions, include at least one point for each section.
- Do not ignore major sections; ensure balanced coverage.

Transcript:
${text}`;
}

export function buildCombinePrompt(summaries: string[], mode?: Mode) {
  const instruction =
    mode === "bullets"
      ? "Combine the partial summaries into concise bullet points."
      : mode === "actions"
      ? "Combine the partial summaries into a single action checklist."
      : "Combine the partial summaries into a concise executive summary.";

  return `${instruction}

Rules:
- Be accurate; do not invent details.
- Keep output under ~12 lines unless necessary.
- Use clear formatting.
- Preserve coverage across all sections represented in the partial summaries.

Partial summaries:
${summaries.join("\n\n")}`;
}
