import { connect } from "@/dbconfig/dbconfig";
import { excludesSpaces, meetsMinimum } from "@/helpers/util/form-validation-utils";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getRequestBody } from "@/helpers/util/request-utils";
import Session from "@/models/session-model";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if request json is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }

    // throw if field types are invalid at runtime
    const { token, password } = reqBody as { token?: string; password?: string };
    if (
      typeof token !== "string" ||
      typeof password !== "string"
    ) {
      console.error("Invalid request");
      return NextResponse.json(
        { error: "Unable to reset password" },
        { status: 400 }
      );
    }

    // throw if valid token is not provided
    if (token.trim().length === 0) {
      console.error("Invalid token");
      return NextResponse.json(
        { error: "Please follow the link from your email" }, 
        { status: 401 }
      );
    }

    // throw if valid password is not provided
    if (!password) {
      console.error("Invalid password");
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    if (!meetsMinimum(password, 8)) {
      console.error("Password failed minimum character test");
      return NextResponse.json(
        { error: "Password must meet minimum character requirement" }, 
        { status: 422 }
      );
    }

    if (!excludesSpaces(password)) {
      console.error("Password contains spaces");
      return NextResponse.json(
        { error: "Password cannot contain spaces" }, 
        { status: 422 }
      );
    }

    // hash incoming raw token with SHA-256 just like when it was stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the user matching the hashed token as long it is not expired
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    // throw if user not found with non-expired matching token
    if (!user) {
      console.error("Invalid or expired token");
      return NextResponse.json(
        { error: "Your token has expired" }, 
        { status: 410 }
      );
    }

    // hash normalized password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // set new values
    const update: object = {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordTokenExpiry: null,
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
      } catch (error) {
        console.error("Failed to record password_reset security event", error);
      }
    }

    let sessionCleanupFailed = false;
    try {
      await Session.deleteMany({ userId: user._id });
    } catch (error) {
      console.error("Failed to delete user sessions after password reset", error);
      sessionCleanupFailed = true;
    }

    // return success
    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
      ...(sessionCleanupFailed && { warning: "Password reset successfully, but could not invalidate existing sessions. Please sign out of other devices manually." }),
    }, { status: 201 });

  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    console.error(message);
    return NextResponse.json(
      { error: "Failed to reset password" }, 
      { status: 500 }
    );
  }
};