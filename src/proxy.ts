import { JWTPayload, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE_NAME } from "./helpers/token";

function requireAuth(path: string) {
  // include all pages that require authorized users
  return (
    path === "/dashboard" ||
    path === "/account" ||
    path === "/onboarding"
  );
}

function rejectAuth(path: string) {
  // include all pages that should redirect authorized users
  return (
    path === "/login" ||
    path === "/signup"
  );
}

async function getAuthTokenPayload(request: NextRequest): Promise<JWTPayload | null> {
  // verify token exists
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  // validate token integrity
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authRequired = requireAuth(path);
  const authRejected = rejectAuth(path);
  const authTokenPayload = await getAuthTokenPayload(request);

  // redirect unauthenticated users away from protected pages
  if (authRequired && !authTokenPayload) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
  
  // redirect non-onboarded authenticated users to onboarding
  if (authTokenPayload?.hasCompletedProfile === false && path !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
  }

  // redirect authenticated users away from signup/login pages
  if (authRejected && authTokenPayload) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
  
  // redirect onboarded authenticated users away from onboarding
  if (authTokenPayload?.hasCompletedProfile === true && path === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
}

export const config = {
  matcher: [
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