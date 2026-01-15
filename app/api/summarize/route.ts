import { NextResponse } from "next/server";

type Mode = "executive" | "bullets" | "actions";

export async function POST(req: Request) {
  const start = Date.now();

  try {
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing GEMINI_API_KEY. Add it to .env.local and restart the server.",
        },
        { status: 500 },
      );
    }

    const prompt = buildPrompt(cleaned, mode);

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 450 },
      }),
    });

    const json = await resp.json();

    if (!resp.ok) {
      const msg = json?.error?.message || "Gemini API error.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const summary =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .join("")
        ?.trim() || "No output returned.";

    const latency = Date.now() - start;

    return NextResponse.json({
      summary,
      tokens_in: Math.ceil(cleaned.length / 4),
      tokens_out: Math.ceil(summary.length / 4),
      latency_ms: latency,
    });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

function buildPrompt(text: string, mode?: Mode) {
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

Transcript:
${text}`;
}
