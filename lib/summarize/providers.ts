type Provider = "gemini" | "huggingface";

export type ProviderResult = {
  summary: string;
  provider: Provider;
};

export async function summarizeWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

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

  const raw = await resp.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {
    if (!resp.ok) {
      throw new Error(`Gemini API error: ${raw}`);
    }
    throw new Error("Gemini returned non-JSON output.");
  }

  if (!resp.ok) {
    const msg = json?.error?.message || "Gemini API error.";
    throw new Error(msg);
  }

  const summary =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text)
      .join("")
      ?.trim() || "";

  if (!summary) {
    throw new Error("Gemini returned empty output.");
  }

  return summary;
}

export async function summarizeWithHuggingFace(
  prompt: string,
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing HUGGINGFACE_API_KEY. Add it to .env.local and restart the server.",
    );
  }

  const model = process.env.HF_SUMMARY_MODEL || "google/flan-t5-base";
  const url = `https://router.huggingface.co/hf-inference/models/${model}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 200, temperature: 0.2 },
    }),
  });

  const json = await resp.json();

  if (!resp.ok) {
    const msg = json?.error || json?.message || "Hugging Face API error.";
    throw new Error(msg);
  }

  const summary = Array.isArray(json)
    ? (json?.[0]?.summary_text || json?.[0]?.generated_text || "").trim()
    : (json?.summary_text || json?.generated_text || "").trim();

  if (!summary) {
    throw new Error("Hugging Face returned empty output.");
  }

  return summary;
}

export async function summarizeWithFallback(
  prompt: string,
): Promise<ProviderResult> {
  try {
    const summary = await summarizeWithGemini(prompt);
    return { summary, provider: "gemini" };
  } catch (err) {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw err;
    }
    const summary = await summarizeWithHuggingFace(prompt);
    return { summary, provider: "huggingface" };
  }
}
