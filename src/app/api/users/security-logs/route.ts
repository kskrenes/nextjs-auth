import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import SecurityLog from "@/models/security-log-model";
import { sanitizeSecurityLogs } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { authorizeRequest } from "@/helpers/util/auth-utils";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

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