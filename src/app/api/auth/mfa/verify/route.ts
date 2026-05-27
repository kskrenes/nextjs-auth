import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { 
  claimMfaPendingToken, 
  clearMfaPendingCookie, 
  deleteMfaPendingToken, 
  getMfaPendingToken, 
  unclaimMfaPendingToken, 
  verifyBackupCode, 
  verifyTotpCode 
} from "@/helpers/util/mfa-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { 
  createSession, 
  signAccessToken, 
  storeAccessTokenCookie, 
  storeRefreshTokenCookie, 
  storeSessionHintCookie 
} from "@/helpers/util/token-utils";
import { MFACodeSchema } from "@/lib/payload-schemas";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let token: string | null = null;
  let claimed = false;
  try {
    await connect();

    // parse json, ensure it's an object, and validate all properties
    const validation = await validateRequestBody(request, MFACodeSchema);
    if (!validation.success) return validation.errorResponse;
    const { code } = validation.data;

    // Atomically claim the pending token — only one concurrent request succeeds.
    token = getMfaPendingToken(request);
    if (!token) {
      return getErrorResponse(400, "MFA token missing");
    }
    const userId = await claimMfaPendingToken(token);
    if (!userId) {
      return getErrorResponse(401, "MFA token invalid or expired");
    }
    claimed = true;

    // fetch user from DB with mfaSecret included
    let user;
    try {
      user = await User.findById(userId).select('+mfaSecret +mfaBackupCodes');
    } catch (dbError) {
      await unclaimMfaPendingToken(token);
      return getErrorResponse(500, "Database error", dbError);
    }

    // ensure a DB match was found
    if (!user) {
      await unclaimMfaPendingToken(token);
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
        await unclaimMfaPendingToken(token);
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
        await unclaimMfaPendingToken(token);
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

    // Wrong code: restore the token to pending so the user can retry
    // without restarting the entire login flow.
    await unclaimMfaPendingToken(token);
    return getErrorResponse(401, "Verification failed");
  } 
  catch (routeError) {
    if (token && claimed) {
      try { await unclaimMfaPendingToken(token); } catch { /* ignore */ }
    }
    return getErrorResponse(500, "Failed to complete multi-factor authentication", routeError);
  }
}