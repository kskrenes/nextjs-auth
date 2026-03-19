import { connect } from "@/dbconfig/dbconfig";
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

    // throw if required params don't exist
    if (!("token" in reqBody) || !("password" in reqBody)) {
      return NextResponse.json(
        { error: "Invalid request" }, 
        { status: 400 }
      );
    }

    // throw if token is invalid
    const token = reqBody.token;
    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid token" }, 
        { status: 400 }
      );
    }

    // throw if no new password provided
    const password = reqBody.password;
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" }, 
        { status: 400 }
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
      return NextResponse.json(
        { error: "Invalid or expired token" }, 
        { status: 400 }
      );
    }

    // hash password
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
      { error: message }, 
      { status: 500 }
    );
  }
};