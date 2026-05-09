import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/token";
import { evictSession } from "@/lib/session-cache";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    // validate sessionId param
    const { sessionId } = await params;
    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // prevent users from revoking their own current session
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: "Cannot revoke current session. Please use the standard logout endpoint." },
        { status: 400 }
      );
    }

    // delete the session from MongoDB only if the session belongs to the authenticated user
    const targetSession = await Session.findOneAndDelete({ sessionId, userId });
    if (!targetSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // evict the deleted session from the cache
    evictSession(sessionId);

    // return success response
    return NextResponse.json({
      message: "Session revoked successfully",
      success: true,
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to delete session";
    console.error(message);
    // throw general route error
    return NextResponse.json(
      { error: "Unable to delete session" }, 
      { status: 500 }
    );
  }
}