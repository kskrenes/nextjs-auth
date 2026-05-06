import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/token";
import { NextRequest, NextResponse } from "next/server";
import SecurityLog from "@/models/security-log-model";
import { sanitizeSecurityLogs } from "@/helpers/security-log-dto";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require an authenticated session — throws AuthTokenError (401) if
    // the cookie is absent, expired, or invalid
    let userId: string;
    try {
      ({ id: userId } = await getIdsFromAccessToken(request));
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }

    // get the most recent 50 security logs for the user, sorted by creation date (newest first)
    const securityLogs = await SecurityLog.find({ userId }).sort({ createdAt: -1 }).limit(50);

    // return success response with security logs
    return NextResponse.json({
      message: "Security logs retrieved",
      success: true,
      securityLogs: sanitizeSecurityLogs(securityLogs),
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to retrieve security logs";
    console.error(message);
    // throw general route error
    return NextResponse.json(
      { error: "Unable to retrieve security logs" }, 
      { status: 500 }
    );
  }
}