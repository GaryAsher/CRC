// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING (Item 7) — KV-backed global rate limiting
// ═══════════════════════════════════════════════════════════════════════════════
// Primary: Cloudflare KV (global, persists across isolate restarts)
// Fallback: In-memory Map (per-isolate, resets on cold start)
// KV is eventually consistent (~60s), which is acceptable for rate limiting —
// worst case a few extra requests sneak through during propagation.

const rateLimitMap = new Map(); // fallback when KV is unavailable
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_TTL = 120;       // KV TTL in seconds (2x window for safety)

export const RATE_LIMITS = {
  '/': 5,               // 5 submissions/min/IP
  '/submit': 5,
  '/submit-game': 3,
  '/approve': 30,
  '/approve-run': 30,
  '/reject-run': 30,
  '/request-changes': 30,
  '/edit-approved-run': 20,
  '/verify-run': 30,
  '/unverify-run': 10,
  '/approve-profile': 30,
  '/reject-profile': 30,
  '/request-profile-changes': 30,
  '/approve-game': 30,
  '/assign-role': 10,
  '/notify': 10,
  '/export-data': 2,    // Heavy query — 2/min/IP
  '/game-editor/save': 20,      // 20 saves/min/IP
  '/game-editor/freeze': 10,
  '/game-editor/delete': 3,
  '/check-game-exists': 10, // lookup only — 10/min/IP
  '/support-game': 5,       // supporter submissions
  '/game-editor/rollback': 5,
};

export async function checkRateLimit(ip, path, env) {
  const limit = RATE_LIMITS[path];
  if (!limit || !ip) return true;
  const key = `rl:${ip}:${path}`;
  const now = Date.now();

  // ── Try KV first (global rate limiting) ──────────────────────────────────
  if (env.RATE_LIMIT_KV) {
    try {
      const raw = await env.RATE_LIMIT_KV.get(key);
      let entry = raw ? JSON.parse(raw) : null;

      if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
        // New window — reset counter
        entry = { count: 1, windowStart: now };
      } else {
        entry.count++;
      }

      // Write back (non-blocking — don't await, fire and forget)
      env.RATE_LIMIT_KV.put(key, JSON.stringify(entry), { expirationTtl: RATE_LIMIT_TTL });

      return entry.count <= limit;
    } catch (err) {
      console.error('KV rate limit error, falling back to in-memory:', err);
      // Fall through to in-memory
    }
  }

  // ── Fallback: in-memory per-isolate rate limiting ────────────────────────
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  const entry = rateLimitMap.get(key);
  if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.windowStart = now;
    return true;
  }
  entry.count++;
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW) rateLimitMap.delete(k);
    }
  }
  return entry.count <= limit;
}
