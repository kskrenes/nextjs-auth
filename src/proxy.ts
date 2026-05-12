import { connect } from "@/dbconfig/dbconfig";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, AuthTokenError, SESSION_HINT_COOKIE_NAME, validateSessionExists, verifyAccessToken } from "./helpers/token";
import { JwtPayload } from "jsonwebtoken";
import { getCachedSession, setCachedSession } from "./lib/session-cache";

function requireAuth(path: string) {
  // protect client pages that require authorized users
  const isProtectedPage = [
    "/dashboard",
    "/account",
    "/onboarding",
  ].includes(path);

  // protect all API routes that require authorized users
  const isProtectedApi = 
    path.startsWith('/api/sign-cloudinary-params') ||
    path.startsWith('/api/users/linkcredentials') ||
    path.startsWith('/api/users/update') ||
    path.startsWith('/api/users/security-logs') ||
    path.startsWith('/api/auth/logout-all') ||
    path.startsWith('/api/auth/sessions');

  return isProtectedPage || isProtectedApi;
}

async function getAuthTokenPayload(request: NextRequest): Promise<JwtPayload | null> {
  // verify token exists
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  // validate token integrity
  try {
    return verifyAccessToken(request);
  } catch (error) {
    if (error instanceof AuthTokenError) {
      return null;
    }
    // re-throw unexpected and non-auth errors
    throw error;
  }
}

async function validateSession(sessionId: string, userId: string): Promise<boolean> {
  // check for cached valid session to avoid DB hit
  const cached = await getCachedSession(sessionId);
  if (cached !== null) return cached;

  // no valid cache entry, check DB and cache result if valid
  await connect();
  const { valid, expiresAt } = await validateSessionExists(sessionId);

  // only cache valid sessions; revoked/invalid sessions skip the cache 
  // to ensure logout-all takes effect immediately
  if (valid && expiresAt) {
    await setCachedSession(sessionId, userId, expiresAt);
  }

  return valid;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api');
  const authTokenPayload = await getAuthTokenPayload(request);
  const sessionId = typeof authTokenPayload?.sessionId === "string" ? authTokenPayload.sessionId : null;
  const userId = typeof authTokenPayload?.id === "string" ? authTokenPayload.id : null;
  const needsOnboarding = authTokenPayload?.hasCompletedProfile === false;
  const hasSessionHint = !!request.cookies.get(SESSION_HINT_COOKIE_NAME)?.value;
  let sessionIsValid = false;

  // intercept when path requires authentication
  if (requireAuth(path)) {

    // handle invalid or missing access token
    if (!authTokenPayload) {
      // return a 401 for protected API routes — the axios interceptor handles refresh+retry
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }

      // For protected pages: only hard-redirect to /login if there is no session hint.
      // If the hint cookie is present, the access token may simply be expired while the
      // refresh token is still valid. Let the page load — the client-side interceptor
      // will call /api/auth/refresh and retry /api/users/me transparently.
      if (!hasSessionHint) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
      }

      // Session hint present but no valid access token — pass through for client refresh.
      // Skip onboarding check since we don't have a valid payload yet.
      return NextResponse.next();
    }

    // handle invalid session or user ids in the token payload
    if (!sessionId || !userId) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      if (!hasSessionHint) return NextResponse.redirect(new URL("/login", request.nextUrl));
      return NextResponse.next();
    }

    sessionIsValid = await validateSession(sessionId, userId);
    
    // handle revoked session
    if (!sessionIsValid) {
      // return a 401 for protected API routes
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    // if the user is authenticated but has not completed onboarding, redirect to onboarding page
    if (needsOnboarding && path !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
    }
  }

  // reuse sessionIsValid from protected route check if already computed, otherwise compute now
  // if the path is /login (session validity is only relevant for login page)
  if (path === "/login" && authTokenPayload && sessionId && userId && !sessionIsValid) {
    sessionIsValid = await validateSession(sessionId, userId);
  }
  
  // redirect authenticated users away from login page (must have auth token and valid session)
  if (path === "/login" && authTokenPayload && sessionIsValid) {
    // if the user needs onboarding, redirect to the onboarding page.
    if (needsOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
    }
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
  
  // if there is no auth token but there is a session hint, redirect to the onboarding page. 
  // if refresh returns a user that is already onboarded, they'll be redirected from there.
  if (path === "/login" && !authTokenPayload && hasSessionHint) {
    return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
  }
  
  // redirect onboarded authenticated users away from onboarding
  if (!needsOnboarding && path === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/account",
    "/dashboard",
    "/onboarding",
    "/login",
    "/signup",
    "/verifyemail",
    "/resetpassword",
    "/triggerpasswordreset",
  ],
}