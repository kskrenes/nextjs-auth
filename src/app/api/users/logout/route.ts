import { TOKEN_COOKIE_NAME } from "@/helpers/token";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      message: "Log out successful",
      success: true,
    });

    // empty session token and expire it immediately
    response.cookies.set(
      TOKEN_COOKIE_NAME, 
      "", 
      { 
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    return response;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to log out";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to log out" }, 
      { status: 500 }
    );
  }
}