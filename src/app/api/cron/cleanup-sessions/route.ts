import { connect } from "@/dbconfig/dbconfig";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // verify configuration of secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" }, 
      { status: 500 }
    );
  }

  // validate request header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401 }
    );
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
  } catch (error) {
    console.error("Session cleanup failed:", error);
    return NextResponse.json(
      { error: "Failed to clean up expired sessions" },
      { status: 500 }
    );
  }
  

}