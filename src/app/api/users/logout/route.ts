import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Log out successful",
      success: true,
    });

    // empty session token and expire it immediately
    response.cookies.set(
      "token", 
      "", 
      { 
        httpOnly: true,
        expires: new Date(0),
      }
    );

    return response;

  } catch (error: unknown) {
    console.error("Logout route error:", error);
    return NextResponse.json(
      { error: "Unable to log out" }, 
      { status: 500 }
    );
  }
}