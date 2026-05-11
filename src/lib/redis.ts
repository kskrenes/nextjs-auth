import { Redis } from "@upstash/redis";

// Automatically loads from process.env.UPSTASH_REDIS_REST_URL/TOKEN
export const redis = Redis.fromEnv();

export const redisKeys = {
  // Pattern: session:{sessionId}
  session: (sessionId: string) => `session:${sessionId}`,

  // Pattern: user-sessions:{userId}
  userSessions: (userId: string) => `user-sessions:${userId}`,
};