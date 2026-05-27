import { connect } from "@/dbconfig/dbconfig";
import { sanitizeSessions } from "@/helpers/dto/session-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId, sessionId } = auth;

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
      currentSessionId: sessionId,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to retrieve sessions", routeError);
  }
}