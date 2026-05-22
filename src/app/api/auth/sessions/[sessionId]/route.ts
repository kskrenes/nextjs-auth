import { connect } from "@/dbconfig/dbconfig";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/util/token-utils";
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
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // validate sessionId param
    const { sessionId } = await params;
    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return getErrorResponse(400, "Invalid session ID");
    }

    // prevent users from revoking their own current session
    if (sessionId === currentSessionId) {
      return getErrorResponse(400, "Cannot revoke current session. Please use the standard logout endpoint.");
    }

    // delete the session from MongoDB only if the session belongs to the authenticated user
    const targetSession = await Session.findOneAndDelete({ sessionId, userId });
    if (!targetSession) {
      return getErrorResponse(404, "Session not found");
    }

    // evict the deleted session from the cache
    await evictSession(sessionId);

    // return success response
    return NextResponse.json({
      message: "Session revoked successfully",
      success: true,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to delete session", routeError);
  }
}