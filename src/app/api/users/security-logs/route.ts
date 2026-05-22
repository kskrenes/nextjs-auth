import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/util/token-utils";
import { NextRequest, NextResponse } from "next/server";
import SecurityLog from "@/models/security-log-model";
import { sanitizeSecurityLogs } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require an authenticated session — throws AuthTokenError (401) if
    // the cookie is absent, expired, or invalid
    let userId: string;
    try {
      ({ id: userId } = await getIdsFromAccessToken(request));
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // get the most recent 50 security logs for the user, sorted by creation date (newest first)
    const securityLogs = await SecurityLog.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const sanitizedLogs = sanitizeSecurityLogs(securityLogs);

    // return success response with security logs
    return NextResponse.json({
      message: "Security logs retrieved",
      success: true,
      securityLogs: sanitizedLogs,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to retrieve security logs", routeError);
  }
}