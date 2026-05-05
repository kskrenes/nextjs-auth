import { signAccessToken, storeAccessTokenCookie, validateRefreshSession } from "@/helpers/token";
import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import Session from "@/models/session-model";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // validate current session
    let session;
    try {
      session = await validateRefreshSession(request);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to validate session";
      console.error(message);
      return NextResponse.json(
        { error: message }, 
        { status: 401 }
      );
    }

    // get session user
    const user = await User.findById(session.userId).select("-password");

    // throw if user not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Generate new access token using signAccessToken
    const accessToken = signAccessToken({
      id: user._id,
      username: user.username,
      email: user.email,
      hasCompletedProfile: user.hasCompletedProfile,
      sessionId: session.sessionId,
    });

    // Update lastActive timestamp on Session document
    await Session.findOneAndUpdate(
      { sessionId: session.sessionId },
      { lastActive: new Date() }
    );

    // create success response
    const response = NextResponse.json(
      {
        message: "Access token refreshed",
        success: true,
        session,
      }, 
      { status: 200 }
    );

    // store access token
    storeAccessTokenCookie(accessToken, response);

    // return success
    return response;
  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to refresh access token";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to refresh access token" }, 
      { status: 500 }
    );
  }
}