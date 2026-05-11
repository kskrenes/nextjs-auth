import { connect } from "@/dbconfig/dbconfig";
import Session from "@/models/session-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connect();
  const result = await Session.deleteMany({ expiresAt: { $lte: new Date() } });

  return NextResponse.json({
    message: "Expired sessions cleaned up",
    deletedCount: result.deletedCount,
  });
}