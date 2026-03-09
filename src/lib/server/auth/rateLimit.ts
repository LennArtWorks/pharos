import db from '$lib/server/db';

const MAX_HITS = 5; // Max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string, action: string, orgId: string): boolean {
  const key = `${ip}:${action}:${orgId}`;
  const now = Date.now();

  const stmt = db.prepare('SELECT hits, window_start FROM rate_limits WHERE key = ?');
  const record = stmt.get(key) as { hits: number; window_start: number } | undefined;

  if (!record) {
    db.prepare('INSERT INTO rate_limits (key, hits, window_start) VALUES (?, 1, ?)').run(key, now);
    return true; // Allowed
  }

  if (now - record.window_start > WINDOW_MS) {
    // Reset window
    db.prepare('UPDATE rate_limits SET hits = 1, window_start = ? WHERE key = ?').run(now, key);
    return true; // Allowed
  }

  if (record.hits >= MAX_HITS) {
    return false; // Blocked
  }

  // Increment hits
  db.prepare('UPDATE rate_limits SET hits = hits + 1 WHERE key = ?').run(key);
  return true; // Allowed
}