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
    const message = error instanceof Error ? error.message : "Unable to retrieve user";
    console.error(message)

    // check for authorization error
    if (/token|jwt|auth/i.test(message)) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // throw general route error
    return NextResponse.json(
      { error: "Unable to retrieve user" }, 
      { status: 500 }
    );
  }
}