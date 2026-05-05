export const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

interface SessionCacheEntry {
  expiresAt: number;
  userId: string;
}

export const sessionCache = new Map<string, SessionCacheEntry>();
// userId → set of sessionIds for per-user eviction
export const userSessionIndex = new Map<string, Set<string>>();

export function getCachedSession(sessionId: string): boolean | null {
  const entry = sessionCache.get(sessionId);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    sessionCache.delete(sessionId);
    // Clean up reverse index
    userSessionIndex.get(entry.userId)?.delete(sessionId);
    return null;
  }
  return true; // only valid sessions are stored
}

export function setCachedSession(sessionId: string, userId: string, dbExpiresAt: number): void {
  const effectiveExpiry = Math.min(dbExpiresAt, Date.now() + SESSION_CACHE_TTL_MS);
  sessionCache.set(sessionId, { expiresAt: effectiveExpiry, userId });

  // maintain reverse index for per-user eviction
  if (!userSessionIndex.has(userId)) {
    userSessionIndex.set(userId, new Set());
  }
  userSessionIndex.get(userId)!.add(sessionId);
}

export function evictUserSessions(userId: string): void {
  const sessionIds = userSessionIndex.get(userId);
  if (sessionIds) {
    for (const sessionId of sessionIds) {
      sessionCache.delete(sessionId);
    }
    userSessionIndex.delete(userId);
  }
}