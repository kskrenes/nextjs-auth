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
      (user.name !== undefined && typeof user.name !== "string") ||
      (user.company !== undefined && typeof user.company !== "string") ||
      (user.website !== undefined && typeof user.website !== "string") ||
      (user.avatarUrl !== undefined && typeof user.avatarUrl !== "string") ||
      !Array.isArray(user.socialLinks) ||
      user.socialLinks.some(element => typeof element !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid user fields" }, 
        { status: 400 }
      );
    }

    // set new values
    const update: any = {
      ...(user.name !== undefined && { name: user.name.trim() }),
      ...(user.company !== undefined && { company: user.company.trim() }),
      ...(user.website !== undefined && { website: user.website.trim() }),
      ...(user.avatarUrl !== undefined && { avatarUrl: user.avatarUrl.trim() }),
      ...(user.socialLinks !== undefined && { socialLinks: user.socialLinks.map((link) => link.trim()) }),
    }

    // update user
    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUserId,
      update,
      {
        returnDocument: 'after',
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
        avatarUrl: updatedUser.avatarUrl,
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