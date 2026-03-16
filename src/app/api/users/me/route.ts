import { connect } from "@/dbconfig/dbconfig";
import { getIdFromToken } from "@/helpers/token";
import User from "@/models/user-model";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // fetch user associated with token
    const userId = await getIdFromToken(request);
    const user = await User.findById(userId)
      .select("-password");

    // throw if user not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // return success
    return NextResponse.json({
      message: "User found",
      user,
    });
  } 
  catch (error: unknown) {
    // check for authorization error
    if (error instanceof Error && /token|jwt|auth/i.test(error.message)) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // throw general route error
    console.error("Get current user route error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve user" }, 
      { status: 500 }
    );
  }
}