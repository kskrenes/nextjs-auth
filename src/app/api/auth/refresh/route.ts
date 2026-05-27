import { signAccessToken, storeAccessTokenCookie, validateRefreshSession } from "@/helpers/util/token-utils";
import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import Session from "@/models/session-model";
import { getErrorResponse } from "@/helpers/util/error-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // validate current session
    let session;
    try {
      session = await validateRefreshSession(request);
    } catch (validateError: unknown) {
      return getErrorResponse(401, "Unable to validate session", validateError);
    }

    // get session user
    const user = await User.findById(session.userId).select("-password");

    // throw if user not found
    if (!user) {
      return getErrorResponse(404, "User not found");
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
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to refresh access token", routeError);
  }
}