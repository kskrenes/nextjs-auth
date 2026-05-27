import { connect } from "@/dbconfig/dbconfig";
import { signAccessToken, storeAccessTokenCookie } from "@/helpers/util/token-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { defaultAvatarId } from "@/helpers/util/avatar-utils";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { getErrorResponse, isDuplicateError } from "@/helpers/util/error-utils";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { UpdateUserSchema } from "@/lib/payload-schemas";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId, sessionId } = auth;

    // parse json, ensure it's an object, and validate any existing fields
    // hasCompletedProfile is added when username is updated
    const validation = await validateRequestBody(request, UpdateUserSchema);
    if (!validation.success) return validation.errorResponse;
    const userUpdates = validation.data;

    // if avatar is being updated, set the old avatar image to be deleted unless it's the default
    let oldAvatarId: string | undefined;
    if (userUpdates.avatarId) {
      const user = await User.findById(userId);
      if (
        user && 
        user.avatarId && 
        user.avatarId !== defaultAvatarId && 
        user.avatarId !== userUpdates.avatarId
      ) {
        oldAvatarId = user.avatarId;
      }
    }

    // update user
    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        userUpdates,
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

    // if hasCompletedProfile changed, refresh access token
    if (userUpdates.hasCompletedProfile) {
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