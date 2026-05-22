import { connect } from "@/dbconfig/dbconfig";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { evictSession } from "@/lib/session-cache";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId, sessionId: currentSessionId } = auth;

    // validate sessionId param
    const { sessionId: sessionIdParam } = await params;
    if (typeof sessionIdParam !== "string" || !sessionIdParam.trim()) {
      return getErrorResponse(400, "Invalid session ID");
    }

    // prevent users from revoking their own current session
    if (sessionIdParam === currentSessionId) {
      return getErrorResponse(400, "Cannot revoke current session. Please use the standard logout endpoint.");
    }

    // delete the session from MongoDB only if the session belongs to the authenticated user
    const targetSession = await Session.findOneAndDelete({ sessionIdParam, userId });
    if (!targetSession) {
      return getErrorResponse(404, "Session not found");
    }

    // evict the deleted session from the cache
    await evictSession(sessionIdParam);

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