import { connect } from "@/dbconfig/dbconfig";
import { AuthTokenError, getIdFromAccessToken, signAccessToken, storeAccessTokenCookie } from "@/helpers/token";
import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { defaultAvatarId } from "@/helpers/themes";
import { sanitizeUser } from "@/helpers/user-dto";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if user is not authenticated
    let authenticatedUserId: string;
    try {
      authenticatedUserId = await getIdFromAccessToken(request);
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: "Unauthorized" }, 
          { status: error.status ?? 401 }
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
    const userUpdates = reqBody;
    if (
      (userUpdates.username !== undefined && typeof userUpdates.username !== "string") ||
      (userUpdates.name !== undefined && typeof userUpdates.name !== "string") ||
      (userUpdates.company !== undefined && typeof userUpdates.company !== "string") ||
      (userUpdates.website !== undefined && typeof userUpdates.website !== "string") ||
      (userUpdates.avatarId !== undefined && typeof userUpdates.avatarId !== "string") ||
      (userUpdates.socialLinks !== undefined && 
        (!Array.isArray(userUpdates.socialLinks) || 
        userUpdates.socialLinks.some((element: any) => typeof element !== "string")))
    ) {
      return NextResponse.json(
        { error: "Invalid user fields" }, 
        { status: 400 }
      );
    }

    const settingUsername = userUpdates.username !== undefined;

    // set new values
    const update: any = {
      ...(userUpdates.username !== undefined && { username: userUpdates.username.trim() }),
      ...(userUpdates.name !== undefined && { name: userUpdates.name.trim() }),
      ...(userUpdates.company !== undefined && { company: userUpdates.company.trim() }),
      ...(userUpdates.website !== undefined && { website: userUpdates.website.trim() }),
      ...(userUpdates.avatarId !== undefined && { avatarId: userUpdates.avatarId.trim() }),
      ...(userUpdates.socialLinks !== undefined && { socialLinks: userUpdates.socialLinks.map((link: any) => link.trim()) }),
    }

    if (settingUsername) {
      update.hasCompletedProfile = true;
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
    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        authenticatedUserId,
        update,
        {
          returnDocument: 'after',
          runValidators: true,
        }
      );
    // throw if username is a duplicate
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    // throw if user not found
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // delete old avatar if one exists
    if (oldAvatarId) {
      try {
        await cloudinary.uploader.destroy(oldAvatarId);  
      } catch (error) {
        console.error("Failed to delete old avatar", error);
      }
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(updatedUser);

    // create success response
    const response = NextResponse.json(
      {
        message: "User updated successfully",
        success: true,
        user: sanitizedUser,
      }, 
      { status: 200 }
    );

    // if updating username, refresh access token
    /*  
      this would also be required if hasCompletedProfile changed, 
      but it can only be changed when setting the username, as per
      EditableProfileFields defined in AuthContext. so just check 
      for settingUsername and reissue
    */
    if (settingUsername) {
      let accessToken;
      try {
        accessToken = signAccessToken({
          id: sanitizedUser.id.toString(),
          username: sanitizedUser.username,
          email: sanitizedUser.email,
          hasCompletedProfile: sanitizedUser.hasCompletedProfile,
        });
      } catch (error) {
        console.error("Failed to sign access token", error);
        return NextResponse.json(
          { error: "Unable to continue session" },
          { status: 500 }
        );
      }

      storeAccessTokenCookie(accessToken, response);
    }

    // return success
    return response;
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