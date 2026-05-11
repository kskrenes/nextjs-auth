import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, clearAuthCookies, getIdsFromAccessToken } from "@/helpers/token";
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
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: "Unauthorized" }, 
          { status: error.status ?? 401 }
        );
      }
      throw error;
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
  catch (error: unknown) {
    console.error(error instanceof Error ? error.message : "Error logging out all devices");
    return NextResponse.json(
      { error: "Error logging out all devices" }, 
      { status: 500 }
    );
  }
}