import { connect } from "@/dbconfig/dbconfig";
import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-model";
import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // throw if request json is invalid
    let reqBody: any;
    try {
      reqBody = await getRequestBody(request);
    } catch(error:any) {
      return NextResponse.json(
        { error: error.message }, 
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

    // hash incoming raw token with SHA-256 just like when it was stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the user matching the hashed token as long it is not expired
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    // throw if user not found with non-expired matching token
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" }, 
        { status: 400 }
      );
    }

    // mark user as verified and clear token fields
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    })
  } 
  catch (error: unknown) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Unable to verify email" }, 
      { status: 500 }
    );
  }
}