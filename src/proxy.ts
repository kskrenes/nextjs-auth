import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, verifyAccessToken } from "./helpers/token";
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
    path.startsWith('api/sign-cloudinary-params') ||
    path.startsWith('api/users/linkcredentials') ||
    path.startsWith('api/users/update')

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
    const payload = verifyAccessToken(request);
    return payload as JwtPayload;
  } catch (error) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api');
  const authTokenPayload = await getAuthTokenPayload(request);
  const needsOnboarding = authTokenPayload?.hasCompletedProfile === false;

  // intercept when path requires authentication
  if (requireAuth(path)) {
    // handle unauthorized user
    if (!authTokenPayload) {
      // return a 401 for protected API routes
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }

      // redirect for protected pages
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    
    // handle authorized but non-onboarded user
    } else if (needsOnboarding && path !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
    }
  }

  // redirect authenticated users away from login page
  if (authTokenPayload && path === '/login') {
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