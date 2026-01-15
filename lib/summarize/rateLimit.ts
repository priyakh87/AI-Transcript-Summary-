type RateEntry = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 1000 * 60;
const DEFAULT_MAX = 10;

const store = new Map<string, RateEntry>();

function getWindowMs() {
  const raw = process.env.SUMMARY_RATE_WINDOW_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WINDOW_MS;
}

function getMaxRequests() {
  const raw = process.env.SUMMARY_RATE_MAX;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX;
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const windowMs = getWindowMs();
  const maxRequests = getMaxRequests();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
