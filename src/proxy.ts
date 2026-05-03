import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, AuthTokenError, SESSION_HINT_COOKIE_NAME, verifyAccessToken } from "./helpers/token";
import { JwtPayload } from "jsonwebtoken";

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
    path.startsWith('/api/users/update');

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

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api');
  const authTokenPayload = await getAuthTokenPayload(request);
  const needsOnboarding = authTokenPayload?.hasCompletedProfile === false;
  const hasSessionHint = !!request.cookies.get(SESSION_HINT_COOKIE_NAME)?.value;

  // intercept when path requires authentication
  if (requireAuth(path)) {
    // handle unauthorized user
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
    
    // handle authorized but non-onboarded user
    } else if (needsOnboarding && path !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
    }
  }

  // redirect authenticated users away from login page
  if (path === '/login') {
    // if the user needs onboarding, or if there is no auth token but there is a session hint,
    // redirect to the onboarding page. If refresh returns a user that is already onboarded,
    // they'll be redirected from there.
    if (needsOnboarding || (!authTokenPayload && hasSessionHint)) {
      return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
    }
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
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