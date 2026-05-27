import { connect } from "@/dbconfig/dbconfig";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validatePayload } from "@/helpers/util/request-utils";
import { SessionParamsSchema } from "@/lib/payload-schemas";
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

    // validate params
    const resolvedParams = await params;
    const validation = validatePayload(SessionParamsSchema, resolvedParams, 400);
    if (!validation.success) return validation.errorResponse;
    const { sessionId: sessionIdParam } = validation.data;

    // prevent users from revoking their own current session
    if (sessionIdParam === currentSessionId) {
      return getErrorResponse(400, "Cannot revoke current session. Please use the standard logout endpoint.");
    }

    // delete the session from MongoDB only if the session belongs to the authenticated user
    const targetSession = await Session.findOneAndDelete({ sessionId: sessionIdParam, userId });
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