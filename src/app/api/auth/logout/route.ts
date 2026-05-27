import { connect } from "@/dbconfig/dbconfig";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { clearAuthCookies, getToken, hashToken, REFRESH_TOKEN_COOKIE_NAME } from "@/helpers/util/token-utils";
import { evictSession } from "@/lib/session-cache";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // retrieve refresh token
    let refreshToken;
    try {
      refreshToken = getToken(request, REFRESH_TOKEN_COOKIE_NAME, "Missing refresh token");
    } catch(tokenError: unknown) {
      console.error(tokenError);
      // fall through if missing, log out anyway
    }

    if (refreshToken) {
      try {
        // delete the corresponding session
        const deletedSession = await Session.findOneAndDelete({
          refreshToken: hashToken(refreshToken)
        })

        // delete session cache
        if (deletedSession) {
          evictSession(deletedSession.sessionId);
        }
      } catch (dbError: unknown) {
        console.error(dbError);
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
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to log out", routeError);
  }
}