import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { VerifyEmailSchema } from "@/lib/payload-schemas";
import User from "@/models/user-model";
import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // parse json, ensure it's an object, and validate all fields
    const validation = await validateRequestBody(request, VerifyEmailSchema);
    if (!validation.success) return validation.errorResponse;
    const { token } = validation.data;

    // hash incoming raw token with SHA-256 just like when it was stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the user matching the hashed token as long it is not expired
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    // throw if user not found with non-expired matching token
    if (!user) {
      return getErrorResponse(400, "Invalid or expired token");
    }

    // mark user as verified and clear token fields
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    // record security event for successful email verification
    try {
      await recordSecurityEvent(
        user._id.toString(), 
        "email_verified", 
        request,
      );
    } catch (logError) {
      console.error("Failed to record email_verified security event", logError);
    }

    // return success response
    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    })
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to verify email", routeError);
  }
}