import { cookies } from 'next/headers'
import crypto from "crypto";
import jwt, { Secret, type JwtPayload } from "jsonwebtoken";
import { NextResponse, type NextRequest } from "next/server";

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

export const getIdFromToken = async (request: NextRequest) => {
  // throw if auth token is not found
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    throw new AuthTokenError(
      "Missing auth token",
      401
    );
  }

  // throw if JWT secret is not configured
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  let decodedToken: string | JwtPayload | undefined;
  try {
    // verify auth token
    decodedToken = jwt.verify(token, secret) as string | JwtPayload;
  } catch (error: unknown) {
    // throw if auth token is invalid or expired
    if (
      error instanceof jwt.TokenExpiredError || 
      error instanceof jwt.JsonWebTokenError
    ) {
      throw new AuthTokenError(
        "Invalid or expired auth token",
        401
      );
    }

    // re-throw unexpected errors as server errors
    throw error;
  }

  // throw if token is missing or malformed 
  if (
    !decodedToken ||
    typeof decodedToken !== "object" ||
    Array.isArray(decodedToken) ||
    typeof (decodedToken as JwtPayload).id !== "string"
  ) {
    throw new AuthTokenError(
      "Invalid auth token payload",
      401
    );
  }

  return (decodedToken as JwtPayload).id;
}

export const signSessionToken = (userData: {
  id: string;
  username: string;
  email: string;
  hasCompletedProfile: boolean;
}): string => {
  // throw if token secret is not configured
  const tokenSecret = process.env.JWT_SECRET;
  if (!tokenSecret) {
    console.error("JWT_SECRET is not configured");
    throw new Error("Invalid server configuration");
  }

  // create session token
  const tokenData = { ...userData };
  const sessionToken = jwt.sign(
    tokenData, 
    tokenSecret, 
    { expiresIn: "1d" }
  );

  return sessionToken;
}
      
export const storeSessionCookie = (token: string, response: NextResponse) => {
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
  // throw if token secret is not configured
  const tokenSecret = process.env.JWT_SECRET as Secret;
  if (!tokenSecret) {
    console.error("JWT_SECRET is not configured");
    throw new Error("Invalid server configuration");
  }
  
  // create access token
  const tokenData = { ...userData };
  const sessionToken = jwt.sign(
    tokenData, 
    tokenSecret, 
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return sessionToken;
}

export const storeAccessTokenCookie = (token: string, response: NextResponse) => {
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

export const storeRefreshTokenCookie = (token: string, response: NextResponse) => {
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