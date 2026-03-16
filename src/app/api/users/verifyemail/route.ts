import { connect } from "@/dbconfig/dbconfig";
import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-model";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // throw if request json is invalid
    let reqBody: any;
    try {
      reqBody = getRequestBody(request);
    } catch(error:any) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    // fetch user associated with the token
    const { token } = reqBody;
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: {$gt: Date.now()}
    });

    // throw if user not found
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // set user as verified and clear token data
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    })

  } catch (error: unknown) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Unable to verify email" }, 
      { status: 500 }
    );
  }
}