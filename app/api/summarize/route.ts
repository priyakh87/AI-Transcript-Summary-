import { NextResponse } from "next/server";
import { summarizeTranscript } from "@/lib/summarize/summarize";
import type { Mode } from "@/lib/summarize/types";
import { checkRateLimit } from "@/lib/summarize/rateLimit";

export async function POST(req: Request) {
  const start = Date.now();

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limit = checkRateLimit(ip);
    if (!limit.ok) {
      const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, retryAfter)) },
        },
      );
    }

    const { text, mode } = (await req.json()) as { text?: string; mode?: Mode };

    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        { error: "Please provide a longer transcript." },
        { status: 400 },
      );
    }

    const cleaned = text.trim();
    if (cleaned.length > 12000) {
      return NextResponse.json(
        { error: "Transcript too long (max 12,000 characters)." },
        { status: 400 },
      );
    }

    const { summary, provider } = await summarizeTranscript(cleaned, mode);
    const latency = Date.now() - start;

    return NextResponse.json({
      summary,
      tokens_in: Math.ceil(cleaned.length / 4),
      tokens_out: Math.ceil(summary.length / 4),
      latency_ms: latency,
      provider,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
