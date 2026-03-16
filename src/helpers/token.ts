import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const TOKEN_COOKIE_NAME = "naetoken" as const;

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