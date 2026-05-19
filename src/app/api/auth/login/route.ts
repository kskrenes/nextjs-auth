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
import { getRequestBody } from "@/helpers/util/request-utils";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if request json is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(authError: unknown) {
      const message = authError instanceof Error ? authError.message : "Invalid request";
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }
    
    // throw if field types are invalid at runtime
    const { email, password } = reqBody as { email?: string; password?: string };
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return getErrorResponse(401, "Invalid email or password");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw if email is not provided
    if (!normalizedEmail) {
      return getErrorResponse(400, "Email is required");
    }
    
    // throw if password is not provided
    if (!normalizedPassword) {
      return getErrorResponse(400, "Password is required");
    }

    // throw one error if user does not exist or if password is invalid
    // to avoid account enumeration
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    const isValidPassword = user ? await bcrypt.compare(normalizedPassword, user.password) : false;
    if (!isValidPassword) {
      return getErrorResponse(401, "Invalid email or password");
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