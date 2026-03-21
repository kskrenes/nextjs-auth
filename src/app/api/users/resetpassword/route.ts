import { connect } from "@/dbconfig/dbconfig";
import { excludesSpaces, meetsMinimum } from "@/helpers/expression-validation";
import { getRequestBody } from "@/helpers/validate-request";
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
        { status: 400 }
      );
    }

    const normalizedPassword = password.trim();

    // throw if valid password is not provided
    if (!normalizedPassword) {
      console.error("Invalid password");
      return NextResponse.json(
        { error: "Unable to reset password" },
        { status: 400 }
      );
    }

    if (!meetsMinimum(normalizedPassword, 8)) {
      console.error("Password failed minimum character test");
      return NextResponse.json(
        { error: "Password must meet minimum character requirement" }, 
        { status: 422 }
      );
    }

    if (!excludesSpaces(normalizedPassword)) {
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
        { status: 400 }
      );
    }

    // hash normalized password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

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
        new: true,
        runValidators: true,
      }
    );

    // return sanitized user
    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        isAdmin: updatedUser.isAdmin,
      },
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