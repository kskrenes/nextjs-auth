import { connect } from "@/dbconfig/dbconfig";
import { getIdFromToken } from "@/helpers/token";
import User from "@/models/user-model";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // fetch user associated with token
    const userId = await getIdFromToken(request);

    const user = await User.findOne({ _id: userId })
      .select("-password");

    return NextResponse.json({
      message: "User found",
      user,
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve user" }, 
      { status: 500 }
    );
  }
}