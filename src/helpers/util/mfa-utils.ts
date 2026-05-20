import crypto from "crypto";
import { OTP } from 'otplib';
import { generateTOTP } from '@otplib/uri';
import { redis, redisKeys } from "@/lib/redis";
import { getRandomToken, getToken, storeCookie } from "./token-utils";
import { NextRequest, NextResponse } from "next/server";
import { RawUser } from "../dto/user-dto";

const MFA_PENDING_COOKIE_NAME =  "naemfa" as const;
const MFA_PENDING_TTL_SECONDS = 5 * 60; // 5 minutes

export const createMfaPendingToken = async (userId: string): Promise<string> => {
  // generate random token
  const token = getRandomToken();

  // create redis key and data to store with token
  const key = redisKeys.mfaToken(token);
  const data = {
    userId,
    timestamp: Date.now(),
  };

  // store in redis with expiration
  await redis.setex(key, MFA_PENDING_TTL_SECONDS, JSON.stringify(data));
  return token;
}

interface MfaTokenData {
  userId: string;
  timestamp: number;
}

export const validateMfaPendingToken = async (token: string): Promise<string | null> => {
  // get redis key for the given token
  const key = redisKeys.mfaToken(token);

  // atomically retrieve the value and delete the key in one step
  const result = await redis.getdel<MfaTokenData>(key);

  // return null if expired or not found
  if (!result) return null;

  // return the userId
  return result.userId;
}

export const storeMfaPendingCookie = (token: string, response: NextResponse): void => {
  storeCookie(
    response,
    token,
    MFA_PENDING_COOKIE_NAME,
    '/',
    MFA_PENDING_TTL_SECONDS
  );
}

export const getMfaPendingToken = (request: NextRequest): string => {
  const token = getToken(request, MFA_PENDING_COOKIE_NAME, "Missing MFA pending token");
  return token;
}

export const clearMfaPendingCookie = (response: NextResponse) => {
  response.cookies.delete(MFA_PENDING_COOKIE_NAME);
}

export const verifyTotpCode = async (secret: string, code: string): Promise<boolean> => { 
  if (!code || code.length !== 6) return false;
  const otp = new OTP();
  const result = await otp.verify({ secret, token: code });
  return result.valid;
}

export const generateSecret = (): string => {
  return new OTP().generateSecret();
}

export const generateOtpauthUri = (email: string, secret: string): string => {
  return generateTOTP({
    issuer: 'nAuth',
    label: email,
    secret
  })
}

export const generateBackupCodes = (): string[] => {
  // Generate 10 random 8-character alphanumeric codes
  const codes: string[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8;

  for (let i = 0; i < 10; i++) {
    let result = '';
    // Generate enough random bytes to cover the length
    const randomBytes = crypto.randomBytes(length);
    
    for (let j = 0; j < length; j++) {
      // Use modulo to map byte value to our character set
      result += chars[randomBytes[j] % chars.length];
    }
    codes.push(result);
  }

  return codes;
}

export const hashBackupCode = (code: string): string => {
  // SHA-256 hash for storage
  return crypto.createHash("sha256").update(code).digest("hex");
}

export const verifyBackupCode = (code: string, hashedCodes: string[]): number | null => {
  // Check if code matches any stored hash, return index if found
  const inputHash = crypto.createHash("sha256").update(code).digest("hex");
  const index = hashedCodes.indexOf(inputHash);
  return index !== -1 ? index : null;
}

export const initiateMfaChallenge = async (user: RawUser) => {
  // store pending state in Redis
  const token = await createMfaPendingToken(user._id.toString());

  // create challenge response for MFA
  const response = NextResponse.json(
    {
      message: "MFA verification required",
      mfaRequired: true,
    }, 
    { status: 200 }
  );

  // set MFA pending cookie
  storeMfaPendingCookie(token, response);

  // return MFA challenge response
  return response;
}