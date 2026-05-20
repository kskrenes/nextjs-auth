import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { clearMfaPendingCookie, deleteMfaPendingToken, getMfaPendingToken, validateMfaPendingToken, verifyBackupCode, verifyTotpCode } from "@/helpers/util/mfa-utils";
import { getRequestBody } from "@/helpers/util/request-utils";
import { createSession, signAccessToken, storeAccessTokenCookie, storeRefreshTokenCookie, storeSessionHintCookie } from "@/helpers/util/token-utils";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // validate request json
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(jsonError: unknown) {
      return getErrorResponse(400, "Invalid request", jsonError);
    }

    // validate request payload
    const { code } = reqBody as { code?: string; };
    if (typeof code !== "string") {
      return getErrorResponse(400, "Invalid request");
    }

    // retrieve MFA pending token and userId
    const token = getMfaPendingToken(request);
    const userId = await validateMfaPendingToken(token);

    // fetch user from DB with mfaSecret included
    const user = await User.findById(userId).select('+mfaSecret +mfaBackupCodes');

    // ensure a DB match was found
    if (!user) {
      return getErrorResponse(404, "User not found");
    }

    // check if code is a TOTP code or backup code
    const isTotp = await verifyTotpCode(user.mfaSecret, code);
    let isBackupCode = false;
    if (!isTotp) {
      const backupCodes = user.mfaBackupCodes;
      const codeIndex = verifyBackupCode(code, backupCodes);
      if (typeof codeIndex === 'number') {
        isBackupCode = true;
        const filteredCodes = backupCodes.filter((_: string, index: number) => index !== codeIndex);
        await User.findByIdAndUpdate(userId, { mfaBackupCodes: filteredCodes });
      }
    }

    if (isTotp || isBackupCode) {
      // create sanitized user for response
      const sanitizedUser = sanitizeUser(user);
  
      // store a new session document
      let refreshToken;
      let sessionId;
      try {
        ({ refreshToken, sessionId } = await createSession(sanitizedUser, request));
      } catch(sessionError) {
        return getErrorResponse(500, "Unable to log in", sessionError);
      }
  
      // create access token
      let accessToken;
      try {
        accessToken = signAccessToken({
          id: sanitizedUser.id.toString(),
          username: sanitizedUser.username,
          email: sanitizedUser.email,
          hasCompletedProfile: sanitizedUser.hasCompletedProfile,
          sessionId,
        });
      } catch (tokenError) {
        return getErrorResponse(500, "Failed to sign access token", tokenError);
      }
  
      // record security event for verified totp or backup code used
      const action = isTotp ? 'mfa_verified' : 'mfa_backup_used';
      try {
        await recordSecurityEvent(
          sanitizedUser.id, 
          action, 
          request,
        );
      } catch (logError) {
        console.error("Failed to record login security event", logError);
      }
  
      // create success response
      const response = NextResponse.json(
        {
          message: "Multi-factor authentication successful",
          success: true,
          user: sanitizedUser,
        }, 
        { status: 200 }
      );

      // clear MFA pending token and cookie
      await deleteMfaPendingToken(token);
      clearMfaPendingCookie(response);
  
      // store access and refresh tokens in separate cookies
      storeAccessTokenCookie(accessToken, response);
      storeRefreshTokenCookie(refreshToken, response);
      storeSessionHintCookie(response);
  
      // return success
      return response;
    }

    // verification failed response
    return getErrorResponse(401, "Verification failed");
  } 
  catch (routeError) {
    return getErrorResponse(500, "Failed to complete multi-factor authentication", routeError);
  }
}