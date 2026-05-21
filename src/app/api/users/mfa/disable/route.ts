import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { verifyBackupCode, verifyTotpCode } from "@/helpers/util/mfa-utils";
import { getRequestBody } from "@/helpers/util/request-utils";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/util/token-utils";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require authentication by validating access token
    let authenticatedUserId: string;
    try {
      ({ id: authenticatedUserId } = await getIdsFromAccessToken(request));
    } catch (authError: unknown) {
      if (authError instanceof AuthTokenError) {
        return NextResponse.json(
          { error: "Unauthorized" }, 
          { status: authError.status ?? 401 }
        );
      }
      throw authError;
    }

    // validate request json
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(jsonError: unknown) {
      return getErrorResponse(400, "Invalid request", jsonError);
    }

    // validate request payload
    const { code } = reqBody as { code?: string; };
    if (typeof code !== "string" || (code.length !==6 && code.length !== 8)) {
      return getErrorResponse(400, "Invalid request");
    }

    // fetch user from DB with mfaSecret included
    let user;
    try {
      user = await User.findById(authenticatedUserId).select('+mfaSecret +mfaBackupCodes');
    } catch (dbError) {
      return getErrorResponse(500, "Database error", dbError);
    }

    // ensure a DB match was found and user still has mfa enabled
    if (!user || !user.mfaEnabled) {
      return getErrorResponse(404, "User not found");
    }

    // check if code is a TOTP code or backup code
    const isTotp = await verifyTotpCode(user.mfaSecret, code);
    if (!isTotp) {
      const backupCodes = user.mfaBackupCodes;
      const codeIndex = verifyBackupCode(code, backupCodes);
      if (typeof codeIndex !== 'number') {
        // invalid code
        return getErrorResponse(400, "Invalid TOTP or backup code");
      }
    }

    // code is valid, update the user document
    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUserId, 
      {
        $set: { mfaEnabled: false },
        $unset: { 
          mfaSecret: "", 
          mfaBackupCodes: "" 
        }
      },
      { new: true }
    );

    // ensure a DB document was updated
    if (!updatedUser) {
      return getErrorResponse(404, "User not found");
    }

    // build sanitized user
    const sanitizedUser = sanitizeUser(updatedUser);

    // record security event for MFA enabled
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        "mfa_disabled", 
        request,
      );
    } catch (logError) {
      console.error("Failed to record mfa_disabled security event", logError);
    }

    // return success response
    return NextResponse.json({
      message: "MFA disabled",
      success: true,
      user: sanitizedUser,
    });
  }
  catch (routeError: unknown) {
    getErrorResponse(500, "Failed to disable MFA", routeError);
  }
}