import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdFromToken } from "@/helpers/token";
import { getRequestBody } from "@/helpers/validate-request";
import type NaeUser from "@/models/user-interface";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if user is not authenticated
    let authenticatedUserId: string;
    try {
      authenticatedUserId = await getIdFromToken(request);
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: error.message }, 
          { status: 401 }
        );
      }
      throw error;
    }

    // throw if request json is invalid
    let reqBody: any;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }

    // check for valid required fields at runtime
    const user = reqBody as Partial<NaeUser>;
    if (
      typeof user.username !== "string" ||
      typeof user.email !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required user fields (username, email)" }, 
        { status: 400 }
      );
    }

    // set new values
    const update: any = {
      username: user.username.trim(),
      email: user.email.trim().toLowerCase(),
    }

    // update user
    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUserId,
      update,
      {
        new: true,
        runValidators: true,
      }
    );

    // return sanitized user
    return NextResponse.json({
      message: "User updated successfully",
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        isAdmin: updatedUser.isAdmin,
      },
    }, { status: 200 });

  } 
  catch (error: unknown) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Unable to update user" }, 
      { status: 500 }
    );
  }
};