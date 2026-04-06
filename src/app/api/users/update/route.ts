import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdFromToken } from "@/helpers/token";
import { getRequestBody } from "@/helpers/validate-request";
import type NaeUser from "@/models/user-interface";
import User, { defaultAvatarId } from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

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
    const userUpdates = reqBody as Partial<NaeUser>;
    if (
      (userUpdates.name !== undefined && typeof userUpdates.name !== "string") ||
      (userUpdates.company !== undefined && typeof userUpdates.company !== "string") ||
      (userUpdates.website !== undefined && typeof userUpdates.website !== "string") ||
      (userUpdates.avatarId !== undefined && typeof userUpdates.avatarId !== "string") ||
      (userUpdates.socialLinks !== undefined && 
        (!Array.isArray(userUpdates.socialLinks) || 
        userUpdates.socialLinks.some(element => typeof element !== "string")))
    ) {
      return NextResponse.json(
        { error: "Invalid user fields" }, 
        { status: 400 }
      );
    }

    // set new values
    const update: any = {
      ...(userUpdates.name !== undefined && { name: userUpdates.name.trim() }),
      ...(userUpdates.company !== undefined && { company: userUpdates.company.trim() }),
      ...(userUpdates.website !== undefined && { website: userUpdates.website.trim() }),
      ...(userUpdates.avatarId !== undefined && { avatarId: userUpdates.avatarId.trim() }),
      ...(userUpdates.socialLinks !== undefined && { socialLinks: userUpdates.socialLinks.map((link) => link.trim()) }),
    }

    // if avatar is being updated, set the old avatar image to be deleted unless it's the default
    let oldAvatarId: string | undefined;
    if (update.avatarId) {
      const user = await User.findById(authenticatedUserId);
      if (
        user && 
        user.avatarId && 
        user.avatarId !== defaultAvatarId && 
        user.avatarId !== update.avatarId
      ) {
        oldAvatarId = user.avatarId;
      }
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

    // delete old avatar if one exists
    if (oldAvatarId) {
      await cloudinary.uploader.destroy(oldAvatarId);
    }

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
        avatarId: updatedUser.avatarId,
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