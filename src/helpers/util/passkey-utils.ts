import { NextRequest, NextResponse } from "next/server";
import { getRandomToken, getToken, storeCookie } from "./token-utils";
import { redis, redisKeys } from "@/lib/redis";
import { CLAIM_SCRIPT, CLAIM_TTL_SECONDS } from "./redis-util";

const challengeTypeConfig = {
  REGISTRATION: {
    redisKey: redisKeys.passkeyRegistration,
    cookieName: 'naepassreg',
    cookiePath: '/api/passkeys',
    ttlSeconds: 5 * 60, // 5 minutes
    missingMessage: "Missing passkey registration token",
  },
  AUTHENTICATION: {
    redisKey: redisKeys.passkeyAuthentication,
    cookieName: 'naepassauth',
    cookiePath: '/api/auth/passkey',
    ttlSeconds: 5 * 60, // 5 minutes
    missingMessage: "Missing passkey authentication token",
  },
} as const;

export type ChallengeType = keyof typeof challengeTypeConfig;

interface RegTokenData {
  userId: string;
  challenge: string;
  timestamp: Date;
}

interface AuthTokenData {
  challenge: string;
  timestamp: Date;
}

type PasskeyTokenData = RegTokenData | AuthTokenData;

// stores challenge in Redis with 5-min TTL, returns random token
export const storePasskeyChallenge = async (challenge: string, type: ChallengeType, userId?: string): Promise<string> => {
  const typeData = challengeTypeConfig[type];

  // generate random token
  const token = getRandomToken();

  // create redis key and data to store with token
  const key = typeData.redisKey(token);
  const data = {
    ...(userId ? { userId } : {}),
    challenge,
    timestamp: Date.now(),
  };

  // store in redis with expiration
  await redis.setex(key, typeData.ttlSeconds, data);
  return token;
}

// claim and retrieve challenge using atomic Lua script (prevents replay)
export const claimChallenge = async (token: string, type: ChallengeType): Promise<string | null> => {
  const key = challengeTypeConfig[type].redisKey(token);
  
  // eval returns the original JSON string on success, null otherwise
  const result = await redis.eval(CLAIM_SCRIPT, [key], [CLAIM_TTL_SECONDS]);
  if (!result) return null;

  const data = (typeof result === "string" ? JSON.parse(result) : result) as PasskeyTokenData;
  return data.challenge;

  // return (data && typeof data === 'object' && 'userId' in data) 
  //   ? (data as RegTokenData).userId 
  //   : null;
}

// cleanup after successful verification
export const deleteChallenge = async (token: string, type: ChallengeType): Promise<void> => {
  const key = challengeTypeConfig[type].redisKey(token);
  await redis.del(key);
}

// Cookie helper — HttpOnly cookie scoped to /api/passkeys or /api/auth/passkey paths
export const storePasskeyChallengeToken = (response: NextResponse, token: string, type: ChallengeType): void => {
  const typeData = challengeTypeConfig[type];
  storeCookie(
    response,
    token,
    typeData.cookieName,
    typeData.cookiePath,
    typeData.ttlSeconds,
  );
}

// Cookie helper — HttpOnly cookie scoped to /api/passkeys or /api/auth/passkey paths
export const getPasskeyChallengeToken = (request: NextRequest, type: ChallengeType): string => {
  const typeData = challengeTypeConfig[type];
  const token = getToken(request, typeData.cookieName, typeData.missingMessage);
  return token;
}