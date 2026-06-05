import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { validateRequestBody } from "@/helpers/util/request-utils";
import Session from "@/models/session-model";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { ResetPasswordSchema } from "@/lib/payload-schemas";
import { evictUserSessions } from "@/lib/session-cache";
import { getIsStrongPassword } from "@/helpers/util/form-validation-utils";
import { clearAuthCookies } from "@/helpers/util/token-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // parse json, ensure it's an object, and validate all fields
    const validation = await validateRequestBody(request, ResetPasswordSchema);
    if (!validation.success) return validation.errorResponse;
    const { token, password } = validation.data;

    // hash incoming raw token with SHA-256 just like when it was stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the user matching the hashed token as long it is not expired
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    // throw if user not found with non-expired matching token
    if (!user) {
      return getErrorResponse(410, "Invalid or expired token");
    }

    // determine password strength
    const hasStrongPassword = getIsStrongPassword(password);

    // hash normalized password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // set new values
    const update: object = {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordTokenExpiry: null,
      hasStrongPassword,
    }

    // update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      update,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    // record security event for successful password reset
    if (updatedUser) {
      try {
        await recordSecurityEvent(
          updatedUser._id.toString(), 
          "password_reset", 
          request,
        );
      } catch (logError) {
        console.error("Failed to record password_reset security event", logError);
      }
    }

    // delete all active sessions on password reset
    let sessionCleanupFailed = false;
    try {
      await Session.deleteMany({ userId: user._id });
      await evictUserSessions(user._id.toString());
    } catch (dbError) {
      console.error("Failed to delete user sessions after password reset", dbError);
      sessionCleanupFailed = true;
    }

    // clear both access and refresh token cookies
    await clearAuthCookies();

    // return success
    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
      ...(sessionCleanupFailed && { warning: "Password reset successfully, but could not invalidate existing sessions. Please sign out of other devices manually." }),
    }, { status: 201 });

  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Failed to reset password", routeError);
  }
};