"use client";

import "./page.scss";

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
    text: `Host: Today we're talking about building habits. Guest: The biggest myth is that motivation is required. Instead, systems beat goals. We discussed making small changes, removing friction, and using tracking to stay consistent. The episode ended with practical tips for designing your environment for success.`,
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
          const responseText = await res.text();
          throw new Error(`Server error: ${responseText || res.statusText}`);
        }
      }

      const data = await res.json();

      const nextMeta = {
        latency_ms: data.latency_ms,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        provider: data.provider,
      };

      setMeta(nextMeta);
      setSummary(data.summary || "");

      cacheRef.current.set(cacheKey, {
        summary: data.summary || "",
        meta: nextMeta,
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

  const onSelectExample = useCallback((id: string) => {
    const next = EXAMPLES.find((item) => item.id === id);
    setExampleId(id);
    if (next) {
      setText(next.text);
      setSummary("");
      setError("");
      setMeta({});
      setCacheHit(false);
    }
  }, []);

  const bulletItems = useMemo(() => {
    if (mode !== "bullets") return [];
    const lines = summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const hasBullets = lines.some((line) => /^[-*]/.test(line));
    const rawItems = hasBullets
      ? lines.map((line) => line.replace(/^[-*\\u2022]\\s*/, ""))
      : (summary.match(/[^.!?]+[.!?]*/g) || [])
          .map((line) => line.trim())
          .filter(Boolean);
    return rawItems;
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
    <main className="page">
      <div className="page__content">
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">Transcript -&gt; Summary</span>
            <h1>Paste a transcript. Get clarity in seconds.</h1>
            <p>
              Turn long transcripts into executive summaries, crisp bullet
              points, or actionable checklists. Built for solo founders,
              researchers, and busy teams.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#summarize">
                Try it now
              </a>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onSelectExample("meeting")}
              >
                Load sample
              </button>
            </div>
            <div className="hero__stats">
              <div className="stat-card">
                <strong>3 summary styles</strong>
                <span>Executive, bullets, actions</span>
              </div>
              <div className="stat-card">
                <strong>Instant export</strong>
                <span>Copy or download .txt</span>
              </div>
              <div className="stat-card">
                <strong>Private by default</strong>
                <span>No transcript storage</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="preview-card">
              <div className="preview-card__title">Latest summary</div>
              <div className="preview-line preview-line--mid" />
              <div className="preview-line" />
              <div className="preview-line preview-line--short" />
              <div className="preview-line" />
              <div className="preview-line preview-line--mid" />
            </div>
          </div>
        </section>

        <section className="section" id="summarize">
          <div className="composer">
            <div className="composer__head">
              <div>
                <p className="eyebrow">Live workspace</p>
                <h2 className="section__title">Summarize any transcript</h2>
                <p className="section__subtitle">
                  Paste your content, choose a style, and generate a clear,
                  structured summary.
                </p>
              </div>
              <div className="composer__meta">
                {modeLabel} - {charCount.toLocaleString()} characters
              </div>
            </div>

            <div className="mode-toggle">
              <button
                type="button"
                onClick={() => setMode("executive")}
                className={mode === "executive" ? "chip chip--active" : "chip"}
              >
                Executive
              </button>
              <button
                type="button"
                onClick={() => setMode("bullets")}
                className={mode === "bullets" ? "chip chip--active" : "chip"}
              >
                Bullets
              </button>
              <button
                type="button"
                onClick={() => setMode("actions")}
                className={mode === "actions" ? "chip chip--active" : "chip"}
              >
                Action items
              </button>
            </div>

            <div className="composer__grid">
              <div className="input-panel">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste transcript here..."
                />
                <div className="input-actions">
                  <div>
                    <label className="composer__meta" htmlFor="example">
                      Examples
                    </label>
                    <div>
                      <select
                        id="example"
                        value={exampleId}
                        onChange={(e) => onSelectExample(e.target.value)}
                        className="select"
                      >
                        {EXAMPLES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onGenerate}
                    disabled={loading}
                    className="btn btn--dark"
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                </div>
                {meta.latency_ms ? (
                  <div className="meta-line">
                    Latency: {meta.latency_ms}ms - Tokens: in {meta.tokens_in} /
                    out {meta.tokens_out}
                  </div>
                ) : null}
              </div>

              <div className="output-panel">
                <div className="output-head">
                  <div className="output-title">
                    Output
                    {cacheHit ? <span className="badge">Cached</span> : null}
                  </div>
                  <div className="output-actions">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(summary)}
                      className="text-link"
                      disabled={!summary}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={onDownload}
                      className="text-link"
                      disabled={!summary}
                    >
                      Download
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="skeleton">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                ) : summary ? (
                  mode === "bullets" && bulletItems.length ? (
                    <ul className="output-list">
                      {bulletItems.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="output-body">{summary}</div>
                  )
                ) : (
                  <div className="composer__meta">
                    Your summary will appear here after you generate it.
                  </div>
                )}
              </div>
            </div>

            {error ? <div className="error-box">{error}</div> : null}
          </div>
        </section>

        <section className="section">
          <p className="eyebrow">How it works</p>
          <h2 className="section__title">From transcript to clarity</h2>
          <p className="section__subtitle">
            Keep it simple: paste, choose a format, export in seconds.
          </p>
          <div className="grid-cards">
            <div className="card">
              <h3>1. Paste the transcript</h3>
              <p>Drop in meeting notes, interviews, or lecture text.</p>
            </div>
            <div className="card">
              <h3>2. Pick a style</h3>
              <p>Executive summary, bullet points, or action items.</p>
            </div>
            <div className="card">
              <h3>3. Export instantly</h3>
              <p>Copy to your notes or download a clean .txt file.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <p className="eyebrow">Use cases</p>
          <h2 className="section__title">Made for everyday workflows</h2>
          <p className="section__subtitle">
            Build summaries for meetings, courses, podcasts, and research.
          </p>
          <div className="grid-cards">
            <div className="card">
              <h3>Team meetings</h3>
              <p>Capture decisions and assign action items in minutes.</p>
            </div>
            <div className="card">
              <h3>Lectures & classes</h3>
              <p>Turn long lectures into concise study notes.</p>
            </div>
            <div className="card">
              <h3>Podcasts & interviews</h3>
              <p>Pull out the key insights without replaying audio.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Ready to summarize faster?</h2>
          <p>Paste your next transcript and get a clear summary instantly.</p>
          <a className="btn btn--primary" href="#summarize">
            Start summarizing
          </a>
        </section>

        <footer className="footer">
          <span>
            Powered by{" "}
            {meta.provider === "huggingface"
              ? "Hugging Face"
              : "Gemini 2.0 Flash"} via /api/summarize.
          </span>
          <span>Built for solo founders and lean teams.</span>
        </footer>
      </div>
    </main>
  );
}
