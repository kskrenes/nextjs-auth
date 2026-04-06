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

    // check for valid fields at runtime
    const user = reqBody as Partial<NaeUser>;
    if (
      typeof user.name !== "string" ||
      typeof user.company !== "string" ||
      typeof user.website !== "string" ||
      typeof user.avatarUrl !== "string" ||
      !Array.isArray(user.socialLinks)
    ) {
      return NextResponse.json(
        { error: "Invalid user fields" }, 
        { status: 400 }
      );
    }

    // set new values
    const update: any = {
      name: user.name?.trim(),
      company: user.company?.trim(),
      website: user.website?.trim(),
      avatarUrl: user.avatarUrl?.trim(),
      socialLinks: user.socialLinks.map((link) => link.trim()),
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
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        company: updatedUser.company,
        website: updatedUser.website,
        socialLinks: updatedUser.socialLinks,
        isVerified: updatedUser.isVerified,
        isAdmin: updatedUser.isAdmin,
      },
    }, { status: 200 });

  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update user";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to update user" }, 
      { status: 500 }
    );
  }
};