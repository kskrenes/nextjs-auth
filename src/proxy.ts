import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // verify token exists
  const token = request.cookies.get("token")?.value;
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
  const isPublicPath = path === "/login" || path === "/signup";
  const isAuthed = await isAuthenticated(request);

  // redirect authenticated users away from signup/login pages
  if (isPublicPath && isAuthed) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // redirect unauthenticated users away from protected pages
  if (!isPublicPath && !isAuthed) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
}

export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
}