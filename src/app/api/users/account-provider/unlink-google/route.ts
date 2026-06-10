import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // find a user with matching id that has google linked and at least one other 
    // sign in method, and remove the google account provider
    const updatedUser = await User.findOneAndUpdate(
      {
       _id: userId,
        accounts: { $elemMatch: { provider: "google" } },
        "accounts.1": { $exists: true } // Ensures array length is >= 2
      },
      { 
        $pull: { 
          accounts: { provider: "google" } 
        } 
      },
      { returnDocument: 'after' }
    );

    // if no user was found, throw error
    if (!updatedUser) {
      return getErrorResponse(404, "Cannot unlink Google account if not linked or no other sign in method is configured");
    }

    // create sanitized user for the response
    const sanitizedUser = sanitizeUser(updatedUser);

    // record security event for successful Google unlinking
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        "google_account_unlinked", 
        request,
      );
    } catch (error) {
      console.error("Failed to record google_account_unlinked security event", error);
    }

    // create success response
    const response = NextResponse.json(
      {
        message: "Google account unlinked successfully",
        success: true,
        user: sanitizedUser,
      },
      { status: 200 }
    );

    // return success
    return response;
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to unlink Google account", routeError);
  }
}