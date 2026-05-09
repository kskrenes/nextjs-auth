import { connect } from "@/dbconfig/dbconfig";
import { sanitizeSessions } from "@/helpers/session-dto";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/token";
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
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }

    // retrieve all sessions associated with the user
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    const sanitizedSessions = sanitizeSessions(sessions);

    // return success response with sanitized sessions
    return NextResponse.json({
      message: "Sessions retrieved",
      success: true,
      sessions: sanitizedSessions,
      currentSessionId,
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to retrieve sessions";
    console.error(message);
    // throw general route error
    return NextResponse.json(
      { error: "Unable to retrieve sessions" }, 
      { status: 500 }
    );
  }
}