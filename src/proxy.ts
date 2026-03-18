import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE_NAME } from "./helpers/token";

function requireAuth(path: string) {
  // include all pages that require authorized users
  return (
    path === "/dashboard" ||
    path === "/profile"
  );
}

function rejectAuth(path: string) {
  // include all pages that should redirect authorized users
  return (
    path === "/login" ||
    path === "/signup"
  );
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // verify token exists
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return false;

  // validate token integrity
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authReqired = requireAuth(path);
  const authRejected = rejectAuth(path);
  const isAuthed = await isAuthenticated(request);

  // redirect unauthenticated users away from protected pages
  if (authReqired && !isAuthed) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // redirect authenticated users away from signup/login pages
  if (authRejected && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
}

export const config = {
  matcher: [
    "/",
    "/profile",
    "/dashboard",
    "/login",
    "/signup",
    "/verifyemail",
    "/resetpassword",
    "/triggerpasswordreset",
  ],
}