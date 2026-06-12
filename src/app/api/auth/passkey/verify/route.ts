import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { claimChallenge, getPasskeyChallengeToken } from "@/helpers/util/passkey-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { createSession, signAccessToken, storeAccessTokenCookie, storeRefreshTokenCookie, storeSessionHintCookie } from "@/helpers/util/token-utils";
import { PasskeyAuthenticationVerificationSchema } from "@/lib/payload-schemas";
import Passkey from "@/models/passkey-model";
import User from "@/models/user-model";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // parse json, ensure it's an object, and validate all properties
    const validation = await validateRequestBody(request, PasskeyAuthenticationVerificationSchema, 401);
    if (!validation.success) return validation.errorResponse;
    const { authenticationResponse } = validation.data;

    // ensure necessary environment variables are configured
    const origin = process.env.APP_ORIGIN;
    const rpID = process.env.APP_HOSTNAME;
    if (!origin || !rpID) return getErrorResponse(500, "Server configuration error");

    // read the challenge token from the cookie
    const authToken = getPasskeyChallengeToken(request, 'AUTHENTICATION');
    if (!authToken) return getErrorResponse(401, 'Unable to read passkey authentication challenge token');

    // atomically claim the token from Redis
    const challenge = await claimChallenge(authToken, 'AUTHENTICATION');
    if (!challenge) return getErrorResponse(401, 'Unable to retrieve passkey authentication challenge');

    // fetch the passkey document (require only userId, credentialId, publicKey, counter fields)
    const passkey = await Passkey
      .findOne({ credentialId: authenticationResponse.id })
      .select('userId credentialId publicKey counter');
    if (!passkey) return getErrorResponse(404, 'Unable to retrieve passkey document');
    const { userId, credentialId, publicKey, counter } = passkey;

    // fetch the associated user document
    const user = await User.findById(userId);
    if (!user) return getErrorResponse(404, 'Unable to retrieve user document');

    // map passkey to the appropriate credential format for SimpleWebAuthn
    const credential = {
      id: credentialId,
      publicKey,
      counter,
    };

    // verify the authentication challenge
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse, 
      expectedChallenge: challenge, 
      expectedOrigin: origin, 
      expectedRPID: rpID, 
      credential,
    });
    if (!verification.verified) return getErrorResponse(401, 'Unable to verify passkey authentication challenge');

    // extract passkey data from verification
    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;

    // update the stored passkey
    await Passkey.findByIdAndUpdate(
      passkey._id,
      {
        counter: newCounter,
        lastUsed: Date.now(),
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    // sanitize the user for the response
    const sanitizedUser = sanitizeUser(user);

    // store a new session document
    let refreshToken, sessionId;
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

    // create success response
    const response = NextResponse.json({
      message: "Passkey authentication response verified",
      success: true,
      user: sanitizedUser,
    });
    
    // store access, refresh, and session hint tokens in separate cookies
    storeAccessTokenCookie(accessToken, response);
    storeRefreshTokenCookie(refreshToken, response);
    storeSessionHintCookie(response);
    
    // record security event for successful passkey login
    try {
      await recordSecurityEvent(
        userId, 
        'passkey_login', 
        request,
      );
    } catch (logError) {
      console.error("Failed to record passkey_login security event", logError);
    }

    // return success response
    return response;
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to verify passkey authentication response", routeError);
  }
}