import { cookies } from 'next/headers'
import crypto from "crypto";
import jwt, { Secret, type JwtPayload } from "jsonwebtoken";
import { NextResponse, type NextRequest } from "next/server";
import Session from "@/models/session-model";
import { sanitizeSession, SessionDTO } from './session-dto';
import { UserDTO } from './user-dto';
import getUAAndIpFromRequest from './request-headers';

export const TOKEN_COOKIE_NAME = "naetoken" as const;
export const ACCESS_TOKEN_COOKIE_NAME = "naetoken" as const;
export const REFRESH_TOKEN_COOKIE_NAME = "naerefresh" as const;
export const SESSION_HINT_COOKIE_NAME = "nae_has_session" as const;
export const ACCESS_TOKEN_COOKIE_PATH = "/" as const;
export const REFRESH_TOKEN_COOKIE_PATH = "/api/auth" as const;
export const SESSION_HINT_COOKIE_PATH = "/" as const;
export const ACCESS_TOKEN_EXPIRY = "15m" as const;
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

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
    throw e;
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

interface AccessTokenIds {
  id: string;
  sessionId?: string;
}

export const getIdsFromAccessToken = async (request: NextRequest): Promise<AccessTokenIds> => {
  const token = getToken(request, ACCESS_TOKEN_COOKIE_NAME, "Missing auth token");
  const secret = verifySecret();
  const decodedToken = decodeToken(token, secret, "Invalid or expired auth token");
  const payload = validatePayload(decodedToken, { id: "string" });

  return {
    id: payload.id as string,
    sessionId: payload.sessionId as string | undefined,
  };
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
  const tokenData = { ...userData, tokenType: "session" as const };
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
  sessionId?: string;
}): string => {
  const secret = verifySecret();

  // create access token
  const tokenData = { ...userData, tokenType: "access" as const };
  const accessToken = jwt.sign(
    tokenData, 
    secret, 
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return accessToken;
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
      path: ACCESS_TOKEN_COOKIE_PATH,
      maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
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
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    }
  );
}

export const storeSessionHintCookie = (response: NextResponse): void => {
  // store token in client cookie
  response.cookies.set(
    SESSION_HINT_COOKIE_NAME,
    "1",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: SESSION_HINT_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS, // matches refresh token lifetime
    }
  );
};

export const clearAuthCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, '', { path: ACCESS_TOKEN_COOKIE_PATH, maxAge: 0 });
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, '', { path: REFRESH_TOKEN_COOKIE_PATH, maxAge: 0 });
  cookieStore.set(SESSION_HINT_COOKIE_NAME, '', { path: SESSION_HINT_COOKIE_PATH, maxAge: 0 });
}

export const verifyAccessToken = (request: NextRequest): JwtPayload => {
  const token = getToken(request, ACCESS_TOKEN_COOKIE_NAME, "Missing access token");
  const secret = verifySecret();
  const decodedToken = decodeToken(token, secret, "Invalid or expired access token");
  const payload = validatePayload(
    decodedToken, 
    { 
      id: "string", 
      sessionId: "string", 
      tokenType: "string" 
    }
  );
  if (payload.tokenType !== "access") {
    throw new AuthTokenError('Invalid access token payload', 401);
  }
  return payload;
}

export const validateRefreshSession = async (request: NextRequest): Promise<SessionDTO> => {
  const rawToken = getToken(request, REFRESH_TOKEN_COOKIE_NAME, "Missing refresh token");
  const hashedToken = hashToken(rawToken);

  // Look up Session by hashed token in DB
  const session = await Session.findOne({ 
    refreshToken: hashedToken,
    expiresAt: { $gt: new Date() }
  });

  // Verify session exists and expiresAt > now
  if (!session) {
    throw new AuthTokenError("Session expired or not found", 401);
  }
  
  return sanitizeSession(session);
}

interface SessionCreationResult {
  refreshToken: string;
  sessionId: string;
}

export const createSession = async (user: UserDTO, request: NextRequest): Promise<SessionCreationResult> => {
  const SESSION_LIMIT = 10;

  // enforce per-user session cap: delete oldest sessions beyond the limit
  const sessionCount = await Session.countDocuments({ userId: user.id });
  if (sessionCount >= SESSION_LIMIT) {
    const oldest = await Session.find({ userId: user.id })
      .sort({ lastActive: 1 })
      .limit(sessionCount - SESSION_LIMIT + 1)
      .select('_id');
    await Session.deleteMany({ _id: { $in: oldest.map(s => s._id) } });
  }

  // generate raw refresh token 
  const refreshToken = getRandomToken();

  // set session expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // create new session document
  const { userAgent, ipAddress } = getUAAndIpFromRequest(request);
  const session = await Session.create({
    userId: user.id,
    refreshToken: hashToken(refreshToken),
    expiresAt,
    lastActive: new Date(),
    userAgent,
    ipAddress,
  });

  return {
    refreshToken,
    sessionId: session.sessionId,
  };
}

export const validateSessionExists = async (
  sessionId: string
): Promise<{ valid: boolean; expiresAt?: number }> => {
  if (!sessionId) return { valid: false };
  const session = await Session.findOne({ sessionId, expiresAt: { $gt: new Date() } });
  return session
    ? { valid: true, expiresAt: (session.expiresAt as Date).getTime() }
    : { valid: false };
}