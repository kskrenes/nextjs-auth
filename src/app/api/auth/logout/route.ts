import { connect } from "@/dbconfig/dbconfig";
import { clearAuthCookies, getToken, hashToken, REFRESH_TOKEN_COOKIE_NAME } from "@/helpers/util/token-utils";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // retrieve refresh token
    let refreshToken;
    try {
      refreshToken = getToken(request, REFRESH_TOKEN_COOKIE_NAME, "Missing refresh token");
    } catch(error: unknown) {
      console.error(error);
      // fall through if missing, log out anyway
    }

    if (refreshToken) {
      try {
        // delete the corresponding session
        await Session.findOneAndDelete({
          refreshToken: hashToken(refreshToken)
        })
      } catch (error: unknown) {
        console.error(error);
        // fall through if already deleted, log out anyway
      }
    }

    // clear both access and refresh token cookies
    await clearAuthCookies();

    // return success response
    return NextResponse.json({
      message: "Log out successful",
      success: true,
    });
  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to log out";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to log out" }, 
      { status: 500 }
    );
  }
}