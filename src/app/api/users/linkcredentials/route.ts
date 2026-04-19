import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { getRequestBody } from "@/helpers/validate-request";
import { excludesSpaces, meetsMinimum } from "@/helpers/expression-validation";
import {
  AuthTokenError,
  getIdFromToken,
  signSessionToken,
  storeSessionCookie,
} from "@/helpers/token";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require an authenticated session — throws AuthTokenError (401) if
    // the cookie is absent, expired, or invalid
    let sessionUserId: string;
    try {
      sessionUserId = await getIdFromToken(request);
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }

    // parse and validate the request body - throw if request is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch (error: unknown) {
      const message = error instanceof Error 
        ? error.message 
        : "Invalid request";
      
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }

    // destructure request
    const { password } = reqBody as { password?: string };

    // validate variables from request body - password type must be string
    if (typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid request" }, 
        { status: 400 }
      );
    }

    // validate variables from request body - password must exist
    if (!password) {
      return NextResponse.json(
        { error: "Invalid password" }, 
        { status: 400 }
      );
    }

    // validate variables from request body - password must meet min length
    if (!meetsMinimum(password, 8)) {
      return NextResponse.json(
        { error: "Password must meet minimum character requirement" },
        { status: 400 }
      );
    }

    // validate variables from request body - password must not include spaces
    if (!excludesSpaces(password)) {
      return NextResponse.json(
        { error: "Password cannot contain spaces" },
        { status: 400 }
      );
    }

    // hash the new password before writing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Single atomic conditional write — links credentials exactly once.
    // The filter requires that no credentials account already exists, so a
    // concurrent request that races here will get null back and return 409.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: sessionUserId,
        "accounts.provider": { $ne: "credentials" },
      },
      {
        $push: {
          accounts: {
            provider: "credentials",
            providerId: sessionUserId,
          },
        },
        $set: {
          password: hashedPassword,
          hasCompletedProfile: true,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      // Two possible causes, both safely reported as 409:
      //   1. User not found (session references a deleted account).
      //   2. Credentials were already linked (concurrent request won the race).
      return NextResponse.json(
        { error: "Credentials already linked or user not found" },
        { status: 409 }
      );
    }

    // create sanitized user for the response
    const sanitizedUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      company: updatedUser.company,
      website: updatedUser.website,
      socialLinks: updatedUser.socialLinks,
      avatarId: updatedUser.avatarId,
      hasCompletedProfile: updatedUser.hasCompletedProfile,
      isVerified: updatedUser.isVerified,
      isAdmin: updatedUser.isAdmin,
      linkedProviders: (updatedUser.accounts ?? []).map(
        (a: { provider: string }) => a.provider
      ),
    };

    // Re-issue the session token: hasCompletedProfile may have just changed
    // from false → true, and the proxy uses that field for onboarding redirects.
    let sessionToken: string;
    try {
      sessionToken = signSessionToken({
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        hasCompletedProfile: updatedUser.hasCompletedProfile,
      });
    } catch {
      return NextResponse.json(
        { error: "Unable to continue session" },
        { status: 500 }
      );
    }

    // create success response
    const response = NextResponse.json(
      {
        message: "Credentials linked successfully",
        success: true,
        user: sanitizedUser,
      },
      { status: 200 }
    );

    // store token in client cookie
    storeSessionCookie(sessionToken, response);

    // return success
    return response;
  } 
  catch (error: unknown) {
    const message = error instanceof Error 
      ? error.message 
      : "Unable to link credentials";

    console.error(message);
    return NextResponse.json(
      { error: "Unable to link credentials" },
      { status: 500 }
    );
  }
}