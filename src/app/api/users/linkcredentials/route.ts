import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { getRequestBody } from "@/helpers/util/request-utils";
import { excludesSpaces, meetsMinimum } from "@/helpers/util/form-validation-utils";
import {
  AuthTokenError,
  getIdsFromAccessToken,
  signAccessToken,
  storeAccessTokenCookie,
} from "@/helpers/util/token-utils";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require an authenticated session — throws AuthTokenError (401) if
    // the cookie is absent, expired, or invalid
    let sessionUserId: string;
    let sessionId: string | undefined;
    try {
      ({ id: sessionUserId, sessionId } = await getIdsFromAccessToken(request));
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // parse and validate the request body - throw if request is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch (jsonError: unknown) {
      return getErrorResponse(400, "Invalid request JSON", jsonError);
    }

    // destructure request
    const { password } = reqBody as { password?: string };

    // validate variables from request body - password type must be string
    if (typeof password !== "string") {
      return getErrorResponse(400, "Invalid request payload");
    }

    // validate variables from request body - password must exist
    if (!password) {
      return getErrorResponse(400, "Invalid password");
    }

    // validate variables from request body - password must meet min length
    if (!meetsMinimum(password, 8)) {
      return getErrorResponse(400, "Password must meet minimum character requirement");
    }

    // validate variables from request body - password must not include spaces
    if (!excludesSpaces(password)) {
      return getErrorResponse(400, "Password cannot contain spaces");
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
      return getErrorResponse(409, "Credentials already linked or user not found");
    }

    // create sanitized user for the response
    const sanitizedUser = sanitizeUser(updatedUser);

    // Re-issue the access token: hasCompletedProfile may have just changed
    // from false → true, and the proxy uses that field for onboarding redirects.
    let accessToken: string;
    try {
      accessToken = signAccessToken({
        id: sanitizedUser.id.toString(),
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
        sessionId,
      });
    } catch {
      return getErrorResponse(500, "Unable to continue session");
    }

    // record security event for successful credential linking
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        "password_created", 
        request,
      );
    } catch (error) {
      console.error("Failed to record password_created security event", error);
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
    storeAccessTokenCookie(accessToken, response);

    // return success
    return response;
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to link credentials", routeError);
  }
}