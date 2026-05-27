import { connect } from "@/dbconfig/dbconfig";
import { NextResponse, type NextRequest } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { 
  createSession, 
  signAccessToken, 
  storeAccessTokenCookie, 
  storeRefreshTokenCookie, 
  storeSessionHintCookie 
} from "@/helpers/util/token-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { initiateMfaChallenge } from "@/helpers/util/mfa-utils";
import { LoginSchema } from "@/lib/payload-schemas";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // parse json, ensure it's an object, and validate all properties
    const validation = await validateRequestBody(request, LoginSchema, 401);
    if (!validation.success) return validation.errorResponse;
    const { email, password } = validation.data;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw one error if user does not exist or if password is invalid
    // to avoid account enumeration
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    const isValidPassword = user ? await bcrypt.compare(normalizedPassword, user.password) : false;
    if (!isValidPassword) {
      return getErrorResponse(401, "Invalid email or password");
    }

    // check if user has MFA enabled
    if (user.mfaEnabled === true) {
      const mfaChallenge = await initiateMfaChallenge(user);
      return mfaChallenge;
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(user);

    // store a new session document
    let refreshToken;
    let sessionId;
    try {
      ({ refreshToken, sessionId } = await createSession(sanitizedUser, request));
    } catch(sessionError) {
      return getErrorResponse(500, "Unable to log in", sessionError);
    }

    // create access token
    let accessToken;
    try {
      accessToken = signAccessToken({
        id: sanitizedUser.id.toString(),
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
        sessionId,
      });
    } catch (tokenError) {
      return getErrorResponse(500, "Failed to sign access token", tokenError);
    }

    // record security event for successful login
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        "login", 
        request,
      );
    } catch (logError) {
      console.error("Failed to record login security event", logError);
    }

    // create success response
    const response = NextResponse.json(
      {
        message: "Authentication successful",
        success: true,
        user: sanitizedUser,
      }, 
      { status: 200 }
    );

    // store access and refresh tokens in separate cookies
    storeAccessTokenCookie(accessToken, response);
    storeRefreshTokenCookie(refreshToken, response);
    storeSessionHintCookie(response);

    // return success
    return response;
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to log in", routeError);
  }
};