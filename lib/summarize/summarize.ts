import crypto from "crypto";
import { buildCombinePrompt, buildPrompt } from "./prompt";
import { summarizeWithFallback } from "./providers";
import { getCachedSummary, setCachedSummary } from "./cache";
import { chunkTranscript } from "./chunk";
import type { Mode } from "./types";

async function summarizePrompt(prompt: string, text: string) {
  const key = crypto.createHash("sha256").update(prompt).digest("hex");
  const cached = getCachedSummary(key);
  if (cached) {
    return cached;
  }

  const result = await summarizeWithFallback(prompt, text);
  setCachedSummary(key, result.summary, result.provider);
  return result;
}

export async function summarizeTranscript(text: string, mode?: Mode) {
  const chunks = chunkTranscript(text);
  if (chunks.length <= 1) {
    const prompt = buildPrompt(text, mode);
    return summarizePrompt(prompt, text);
  }

  const partials = [];
  let provider: "gemini" | "huggingface" = "gemini";

  for (const chunk of chunks) {
    const prompt = buildPrompt(chunk, mode);
    const result = await summarizePrompt(prompt, chunk);
    partials.push(result.summary);
    provider = result.provider;
  }

  const combinePrompt = buildCombinePrompt(partials, mode);
  const combined = await summarizePrompt(combinePrompt, partials.join("\n\n"));

  return {
    summary: combined.summary,
    provider: combined.provider || provider,
  };
}
