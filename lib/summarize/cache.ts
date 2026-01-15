type CacheEntry = {
  summary: string;
  provider: "gemini" | "huggingface";
  expiresAt: number;
};

const DEFAULT_TTL_MS = 1000 * 60 * 10;
const DEFAULT_MAX_ENTRIES = 200;

const cache = new Map<string, CacheEntry>();

function getTtlMs() {
  const raw = process.env.SUMMARY_CACHE_TTL_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MS;
}

function getMaxEntries() {
  const raw = process.env.SUMMARY_CACHE_MAX;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ENTRIES;
}

export function getCachedSummary(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCachedSummary(
  key: string,
  summary: string,
  provider: "gemini" | "huggingface",
) {
  if (cache.size >= getMaxEntries()) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    summary,
    provider,
    expiresAt: Date.now() + getTtlMs(),
  });
}
