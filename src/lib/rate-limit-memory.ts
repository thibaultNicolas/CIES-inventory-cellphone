/**
 * Limiteur simple en mémoire (par processus Node).
 * Sur Vercel (plusieurs isolats), le plafond est appliqué par instance — utile contre le spam grossier.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
const MAX_KEYS = 50_000;

function pruneIfNeeded() {
  if (store.size <= MAX_KEYS) return;
  const now = Date.now();
  for (const [k, b] of store) {
    if (now > b.resetAt) store.delete(k);
    if (store.size <= MAX_KEYS * 0.8) break;
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  pruneIfNeeded();

  let b = store.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 1, resetAt: now + windowMs };
    store.set(key, b);
    return { ok: true };
  }

  if (b.count >= max) {
    return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) };
  }

  b.count += 1;
  return { ok: true };
}
