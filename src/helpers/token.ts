import { cookies } from 'next/headers'
import crypto from "crypto";
import jwt, { Secret, type JwtPayload } from "jsonwebtoken";
import { NextResponse, type NextRequest } from "next/server";
import Session from "@/models/session-model";
import { SessionDTO } from './session-dto';

export const TOKEN_COOKIE_NAME = "naetoken" as const;
export const ACCESS_TOKEN_COOKIE_NAME = "naetoken" as const;
export const REFRESH_TOKEN_COOKIE_NAME = "naerefresh" as const;
export const ACCESS_TOKEN_EXPIRY = "15m" as const;
export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthTokenError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AuthTokenError";
  }
}

export const getToken = (request: NextRequest, name: string, error: string): string => {
  // throw if token is not found
  const token = request.cookies.get(name)?.value;
  if (!token) {
    throw new AuthTokenError(error, 401);
  }
  return token;
}

const verifySecret = (): Secret => {
  // throw if JWT secret is not configured
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

const decodeToken = (
  token: string, 
  secret: Secret, 
  error: string
): string | JwtPayload | undefined => {
  let decodedToken: string | JwtPayload | undefined;
  try {
    // verify token
    decodedToken = jwt.verify(token, secret) as string | JwtPayload;
  } 
  catch (e: unknown) {
    // throw if token is invalid or expired
    if (
      e instanceof jwt.TokenExpiredError || 
      e instanceof jwt.JsonWebTokenError
    ) {
      throw new AuthTokenError(error, 401);
    }

    // re-throw unexpected errors as server errors
    throw error;
  }

  return decodedToken;
}

const validatePayload = (
  payload: string | JwtPayload | undefined, 
  schema: Record<string, string> | undefined = {}
): JwtPayload => {
  const error = new AuthTokenError("Invalid auth token payload", 401);
  // throw if token is missing or malformed 
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw error;
  }

  // throw if required properties are missing or malformed
  if (!Object.keys(schema).every((key) => {
    const expectedType = schema[key];
    const actualValue = payload[key];

    // Check if key exists and its typeof matches the expected type string
    return key in payload && typeof actualValue === expectedType;
  })) {
    throw error;
  };

  return payload;
}

export const getIdFromToken = async (request: NextRequest): Promise<string> => {
  const token = getToken(request, TOKEN_COOKIE_NAME, "Missing auth token");
  const secret = verifySecret();
  const decodedToken = decodeToken(token, secret, "Invalid or expired auth token");
  const payload = validatePayload(decodedToken, { id: "string" });

  return payload.id as string;
}

export const signSessionToken = (userData: {
  id: string;
  username: string;
  email: string;
  hasCompletedProfile: boolean;
}): string => {
  // throw if token secret is not configured
  const secret = verifySecret();

  // create session token
  const tokenData = { ...userData };
  const sessionToken = jwt.sign(
    tokenData, 
    secret, 
    { expiresIn: "1d" }
  );

  return sessionToken;
}
      
export const storeSessionCookie = (token: string, response: NextResponse): void => {
  // store token in client cookie
  response.cookies.set(
    TOKEN_COOKIE_NAME, 
    token, 
    { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    }
  );
}

// generate a cryptographically random raw token (32 bytes → 64-char hex string)
export const getRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
}

// hash with SHA-256 for DB storage (deterministic, fast, secure for high-entropy tokens)
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const signAccessToken = (userData: {
  id: string;
  username: string;
  email: string;
  hasCompletedProfile: boolean;
}): string => {
  const secret = verifySecret();

  // create access token
  const tokenData = { ...userData };
  const sessionToken = jwt.sign(
    tokenData, 
    secret, 
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return sessionToken;
}

export const storeAccessTokenCookie = (token: string, response: NextResponse): void => {
  // store token in client cookie
  response.cookies.set(
    ACCESS_TOKEN_COOKIE_NAME, 
    token, 
    { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_EXPIRY_MS,
    }
  );
}

export const storeRefreshTokenCookie = (token: string, response: NextResponse): void => {
  // store token in client cookie
  response.cookies.set(
    REFRESH_TOKEN_COOKIE_NAME, 
    token, 
    { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    }
  );
}
export const clearAuthCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

export const verifyAccessToken = (request: NextRequest): JwtPayload => {
  const token = getToken(request, ACCESS_TOKEN_COOKIE_NAME, "Missing access token");
  const secret = verifySecret();
  const decodedToken = decodeToken(token, secret, "Invalid or expired access token");
  const payload = validatePayload(decodedToken);
  return payload;
}

export const validateRefreshSession = async (request: NextRequest): Promise<SessionDTO> => {
  const rawToken = getToken(request, REFRESH_TOKEN_COOKIE_NAME, "Missing refresh token");
  const hashedToken = hashToken(rawToken);

  // Look up Session by hashed token in DB
  const session = await Session.findOne({ 
    refreshToken: hashedToken,
    expiresAt: { $gt: new Date() }
  }) as SessionDTO;

  // Verify session exists and expiresAt > now
  if (!session) {
    throw new Error("Session expired or not found");
  }
  
  return session;
}