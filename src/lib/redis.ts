import { Redis } from "@upstash/redis";

// validate environment variables
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('Missing required Upstash Redis environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
}

export const redis = new Redis({ url, token });

export const redisKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user-sessions:${userId}`,
  mfaToken: (token: string) => `mfa-pending:${token}`,
  mfaSetup: (userId: string) => `mfa-setup:${userId}`,
};