import { connect } from "@/dbconfig/dbconfig";
import { getErrorResponse } from "@/helpers/util/error-utils";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // verify configuration of secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return getErrorResponse(500, "CRON_SECRET is not configured");
  }

  // validate request header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return getErrorResponse(401, "Unauthorized");
  }

  try {
    await connect();

    // delete expired sessions
    const result = await Session.deleteMany({ expiresAt: { $lte: new Date() } });

    // return success response
    return NextResponse.json({
      message: "Expired sessions cleaned up",
      deletedCount: result.deletedCount,
    });
  } 
  catch (routeError) {
    return getErrorResponse(500, "Failed to clean up expired sessions", routeError);
  }
  

}