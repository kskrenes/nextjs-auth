import { connect } from "@/dbconfig/dbconfig";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { AuthTokenError, clearAuthCookies, getIdsFromAccessToken } from "@/helpers/util/token-utils";
import { evictUserSessions } from '@/lib/session-cache'
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // validate the current access token to get the user id
    let userId: string;
    try {
      ({ id: userId } = await getIdsFromAccessToken(request));
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // delete all session documents for the user
    const result = await Session.deleteMany({ userId });
    const deletedCount = result.deletedCount || 0;

    // evict all cached sessions for the user to ensure logout-all takes effect immediately
    await evictUserSessions(userId);

    // clear the access and refresh token cookies and session hint cookie
    await clearAuthCookies();

    // return success response with number of devices logged out
    return NextResponse.json(
      { 
        message: `Logged out of ${deletedCount} device(s) successfully`,
        success: true,
        deletedCount,
      }, 
      { status: 200 }
    );
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Error logging out all devices", routeError);
  }
}