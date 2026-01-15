"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "executive" | "bullets" | "actions";

const EXAMPLE = `Speaker 1: Today we need to finalize the launch timeline.
Speaker 2: Frontend is 80% done; remaining work is testing and localization.
Speaker 1: Backend APIs are stable. We should add monitoring and rate limits.
Speaker 2: Action items: finalize RTL UI, add e2e tests, deploy to staging by Friday.`;

const EXAMPLES = [
  {
    id: "meeting",
    label: "Meeting",
    text: EXAMPLE,
  },
  {
    id: "lecture",
    label: "Lecture",
    text: `Today we covered the basics of machine learning: supervised vs. unsupervised learning, and the bias-variance tradeoff. We also introduced linear regression and discussed how loss functions are optimized using gradient descent. Key points included overfitting, regularization, and the importance of training/validation splits.`,
  },
  {
    id: "podcast",
    label: "Podcast",
    text: `Host: Today we’re talking about building habits. Guest: The biggest myth is that motivation is required. Instead, systems beat goals. We discussed making small changes, removing friction, and using tracking to stay consistent. The episode ended with practical tips for designing your environment for success.`,
  },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("executive");
  const [text, setText] = useState(EXAMPLE);
  const [exampleId, setExampleId] = useState("meeting");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [meta, setMeta] = useState<{
    latency_ms?: number;
    tokens_in?: number;
    tokens_out?: number;
    provider?: "gemini" | "huggingface";
  }>({});
  const [cacheHit, setCacheHit] = useState(false);
  const cacheRef = useRef<Map<string, { summary: string; meta: any }>>(
    new Map(),
  );
  const initialRender = useRef(true);

  const charCount = text.length;

  const modeLabel = useMemo(() => {
    switch (mode) {
      case "executive":
        return "Executive summary";
      case "bullets":
        return "Bullet summary";
      case "actions":
        return "Action items";
      default:
        return "Summary";
    }
  }, [mode]);

  const cacheKey = useMemo(() => {
    return `${mode}::${text.trim()}`;
  }, [mode, text]);

  const onGenerate = useCallback(async () => {
    setError("");
    setSummary("");
    setCacheHit(false);
    setLoading(true);

    try {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setMeta(cached.meta || {});
        setSummary(cached.summary || "");
        setCacheHit(true);
        return;
      }

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await res.json();
          throw new Error(data?.error || "Something went wrong.");
        } else {
          const text = await res.text();
          throw new Error(`Server error: ${text || res.statusText}`);
        }
      }

      const data = await res.json();

      setMeta({
        latency_ms: data.latency_ms,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        provider: data.provider,
      });

      setSummary(data.summary || "");
      cacheRef.current.set(cacheKey, {
        summary: data.summary || "",
        meta: {
          latency_ms: data.latency_ms,
          tokens_in: data.tokens_in,
          tokens_out: data.tokens_out,
          provider: data.provider,
        },
      });
    } catch (e: any) {
      setError(e?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, mode, text]);

  const onDownload = useCallback(() => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [summary]);

  const bulletItems = useMemo(() => {
    if (mode !== "bullets") return [];
    return summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*•]\s*/, ""));
  }, [mode, summary]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (text.trim().length < 30) {
      return;
    }

    const timer = setTimeout(() => {
      void onGenerate();
    }, 700);

    return () => clearTimeout(timer);
  }, [mode, text, onGenerate]);

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-4xl p-6 md:p-10'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Paste a transcript. Get a summary.
          </h1>
          <p className='mt-2 text-gray-600'>
            Choose a style — executive, bullets, or action items — and get a
            clean output in seconds.
          </p>
        </header>

        <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-200'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setMode("executive")}
                className={`rounded-full px-4 py-2 text-sm border ${
                  mode === "executive"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
                }`}>
                Executive
              </button>
              <button
                type='button'
                onClick={() => setMode("bullets")}
                className={`rounded-full px-4 py-2 text-sm border ${
                  mode === "bullets"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
                }`}>
                Bullets
              </button>
              <button
                type='button'
                onClick={() => setMode("actions")}
                className={`rounded-full px-4 py-2 text-sm border ${
                  mode === "actions"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
                }`}>
                Action items
              </button>
            </div>

            <div className='text-sm text-gray-600'>
              {modeLabel} • {charCount.toLocaleString()} chars
            </div>
          </div>

          <div className='mt-4'>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className='h-56 w-full resize-none rounded-xl border border-gray-200 p-4 outline-none focus:border-gray-400'
              placeholder='Paste transcript here...'
            />
            <div className='mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-center gap-2'>
                <label htmlFor='example' className='text-sm text-gray-600'>
                  Examples
                </label>
                <select
                  id='example'
                  value={exampleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const next = EXAMPLES.find((item) => item.id === nextId);
                    setExampleId(nextId);
                    if (next) {
                      setText(next.text);
                      setSummary("");
                      setError("");
                      setMeta({});
                    }
                  }}
                  className='rounded-xl border border-gray-200 px-3 py-2 text-sm'>
                  {EXAMPLES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type='button'
                onClick={onGenerate}
                disabled={loading}
                className='rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60'>
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
            {meta.latency_ms ? (
              <p className='mt-2 text-xs text-gray-500'>
                Latency: {meta.latency_ms}ms • Tokens: in {meta.tokens_in} / out{" "}
                {meta.tokens_out}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className='mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
              {error}
            </div>
          ) : null}

          {loading ? (
            <section className='mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-gray-800'>Output</h2>
                <div className='h-4 w-10 rounded bg-gray-200' />
              </div>
              <div className='space-y-2 animate-pulse'>
                <div className='h-3 w-11/12 rounded bg-gray-200' />
                <div className='h-3 w-10/12 rounded bg-gray-200' />
                <div className='h-3 w-9/12 rounded bg-gray-200' />
                <div className='h-3 w-8/12 rounded bg-gray-200' />
              </div>
            </section>
          ) : null}

          {summary && !loading ? (
            <section className='mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-sm font-semibold text-gray-800'>Output</h2>
                  {cacheHit ? (
                    <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700'>
                      Cached
                    </span>
                  ) : null}
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => navigator.clipboard.writeText(summary)}
                    className='text-sm text-gray-700 underline underline-offset-4'>
                    Copy
                  </button>
                  <button
                    type='button'
                    onClick={onDownload}
                    className='text-sm text-gray-700 underline underline-offset-4'>
                    Download
                  </button>
                </div>
              </div>
              {mode === "bullets" && bulletItems.length ? (
                <ul className='list-disc space-y-1 pl-5 text-sm text-gray-900'>
                  {bulletItems.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <pre className='whitespace-pre-wrap text-sm text-gray-900'>
                  {summary}
                </pre>
              )}
            </section>
          ) : null}
        </div>

        <footer className='mt-6 text-xs text-gray-500'>
          Powered by{" "}
          {meta.provider === "huggingface"
            ? "Hugging Face"
            : "Gemini 2.0 Flash"}{" "}
          via <code>/api/summarize</code>.
        </footer>
      </div>
    </main>
  );
}
