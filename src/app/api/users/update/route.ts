import { connect } from "@/dbconfig/dbconfig";
import { signAccessToken, storeAccessTokenCookie } from "@/helpers/util/token-utils";
import { getRequestBody } from "@/helpers/util/request-utils";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { defaultAvatarId } from "@/helpers/util/avatar-utils";
import { sanitizeUser, UserDTO } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse, isDuplicateError } from "@/helpers/util/error-utils";
import { authorizeRequest } from "@/helpers/util/auth-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId, sessionId } = auth;

    // throw if request json is invalid
    let reqBody: unknown;
    try {
      reqBody = await getRequestBody(request);
    } catch(jsonError: unknown) {
      return getErrorResponse(400, "Invalid request JSON", jsonError);
    }

    // throw if request payload is invalid
    if (!reqBody || typeof reqBody !== "object" || Array.isArray(reqBody)) {
      return getErrorResponse(400, "Invalid request payload");
    }

    const userUpdates = reqBody as Partial<UserDTO>;
    
    // check for valid fields at runtime
    if (
      (userUpdates.username !== undefined && typeof userUpdates.username !== "string") ||
      (userUpdates.name !== undefined && typeof userUpdates.name !== "string") ||
      (userUpdates.company !== undefined && typeof userUpdates.company !== "string") ||
      (userUpdates.website !== undefined && typeof userUpdates.website !== "string") ||
      (userUpdates.avatarId !== undefined && typeof userUpdates.avatarId !== "string") ||
      (userUpdates.socialLinks !== undefined && 
        (!Array.isArray(userUpdates.socialLinks) || 
        userUpdates.socialLinks.some((element: string) => typeof element !== "string")))
    ) {
      return getErrorResponse(400, "Invalid user fields");
    }

    const settingUsername = userUpdates.username !== undefined;

    // set new values
    const update: Partial<UserDTO> = {
      ...(userUpdates.username !== undefined && { username: userUpdates.username.trim() }),
      ...(userUpdates.name !== undefined && { name: userUpdates.name.trim() }),
      ...(userUpdates.company !== undefined && { company: userUpdates.company.trim() }),
      ...(userUpdates.website !== undefined && { website: userUpdates.website.trim() }),
      ...(userUpdates.avatarId !== undefined && { avatarId: userUpdates.avatarId.trim() }),
      ...(userUpdates.socialLinks !== undefined && { socialLinks: userUpdates.socialLinks.map((link: string) => link.trim()) }),
    }

    // throw if no-op
    if (Object.keys(update).length === 0) {
      return getErrorResponse(400, "No updatable fields provided");
    }

    if (settingUsername) {
      update.hasCompletedProfile = true;
    }

    // if avatar is being updated, set the old avatar image to be deleted unless it's the default
    let oldAvatarId: string | undefined;
    if (update.avatarId) {
      const user = await User.findById(userId);
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
        userId,
        update,
        {
          returnDocument: 'after',
          runValidators: true,
        }
      );
    // throw if username is a duplicate
    } catch (dbError: unknown) {
      if (isDuplicateError(dbError)) {
        return getErrorResponse(409, "Username already exists", dbError);
      }
      throw dbError;
    }

    // throw if user not found
    if (!updatedUser) {
      return getErrorResponse(404, "User not found");
    }

    // delete old avatar if one exists
    if (oldAvatarId) {
      try {
        await cloudinary.uploader.destroy(oldAvatarId);  
      } catch (avatarError) {
        console.error("Failed to delete old avatar", avatarError);
      }
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(updatedUser);

    // record security event for profile update
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        "profile_updated", 
        request,
      );
    } catch (logError) {
      console.error("Failed to record profile_updated security event", logError);
    }

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
          sessionId,
        });
      } catch (resignError) {
        return getErrorResponse(500, "Unable to continue session", resignError);
      }

      storeAccessTokenCookie(accessToken, response);
    }

    // return success
    return response;
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to update user", routeError);
  }
};