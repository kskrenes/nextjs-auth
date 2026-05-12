import { redis, redisKeys } from "./redis";

export const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

interface SessionCacheEntry {
  expiresAt: number;
  userId: string;
}

export async function getCachedSession(sessionId: string): Promise<boolean> {
  const key = redisKeys.session(sessionId);
  const entry = await redis.get<SessionCacheEntry>(key);
  
  return entry != null;
}

export async function setCachedSession(sessionId: string, userId: string, dbExpiresAt: number): Promise<void> {
  const effectiveExpiryMS = Math.min(dbExpiresAt - Date.now(), SESSION_CACHE_TTL_MS);
  const sessionKey = redisKeys.session(sessionId);
  const userKey = redisKeys.userSessions(userId);
  const p = redis.pipeline();

  p.set(
    sessionKey, 
    { expiresAt: effectiveExpiryMS, userId }, 
    { px: effectiveExpiryMS }
  );

  p.sadd(userKey, sessionId);
  await p.exec();
}

export async function evictSession(sessionId: string): Promise<void> {
  const sessionKey = redisKeys.session(sessionId);
  const entry = await redis.get(sessionKey) as SessionCacheEntry | null;
  if (entry) {
    const userId = entry.userId;
    const userKey = redisKeys.userSessions(userId);
    await redis.pipeline().del(sessionKey).srem(userKey, sessionId).exec();
  }
}

export async function evictUserSessions(userId: string): Promise<void> {
  const userKey = redisKeys.userSessions(userId);
  const sessionIds = await redis.smembers(userKey) as string[] | null;
  if (!sessionIds || sessionIds.length === 0) return;

  const p = redis.pipeline();

  // Queue deletion for each "session:{id}"
  sessionIds.forEach((id) => {
    p.del(redisKeys.session(id));
  });
  
  // Queue deletion for "user-sessions:{userId}"
  p.del(userKey); 

  await p.exec();
}
