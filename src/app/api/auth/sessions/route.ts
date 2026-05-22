import { connect } from "@/dbconfig/dbconfig";
import { sanitizeSessions } from "@/helpers/dto/session-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/util/token-utils";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require an authenticated session — throws AuthTokenError (401) if
    // the cookie is absent, expired, or invalid
    let userId: string;
    let currentSessionId: string | undefined;
    try {
      ({ id: userId, sessionId: currentSessionId } = await getIdsFromAccessToken(request));
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // retrieve all sessions associated with the user
    const sessions = await Session.find({ 
      userId,
      expiresAt: { $gt: new Date() }   // filter out expired-but-not-yet-TTL-deleted docs
    }).sort({ lastActive: -1 });
    const sanitizedSessions = sanitizeSessions(sessions);

    // return success response with sanitized sessions
    return NextResponse.json({
      message: "Sessions retrieved",
      success: true,
      sessions: sanitizedSessions,
      currentSessionId,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to retrieve sessions", routeError);
  }
}