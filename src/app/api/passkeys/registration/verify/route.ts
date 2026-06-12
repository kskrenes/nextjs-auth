import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { claimChallenge, getPasskeyChallengeToken } from "@/helpers/util/passkey-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { PasskeyRegistrationVerificationSchema } from "@/lib/payload-schemas";
import Passkey from "@/models/passkey-model";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // parse json, ensure it's an object, and validate all properties
    const validation = await validateRequestBody(request, PasskeyRegistrationVerificationSchema, 401);
    if (!validation.success) return validation.errorResponse;
    const { registrationResponse } = validation.data;

    // ensure necessary environment variables are configured
    const origin = process.env.APP_ORIGIN;
    const rpID = process.env.APP_HOSTNAME;
    if (!origin || !rpID) return getErrorResponse(500, "Server configuration error");

    // read the challenge token from the cookie
    const regToken = getPasskeyChallengeToken(request, 'REGISTRATION');
    if (!regToken) return getErrorResponse(401, 'Unable to read passkey challenge token');

    // atomically claim the token from Redis
    const challenge = await claimChallenge(regToken, 'REGISTRATION');
    if (!challenge) return getErrorResponse(401, 'Unable to retrieve passkey challenge');

    // verify the registration challenge
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!verification.verified) return getErrorResponse(401, 'Unable to verify passkey registration challenge');

    // extract passkey data from verification
    const { registrationInfo } = verification;
    const { credential, credentialDeviceType } = registrationInfo;

    // devise a default nickname for the passkey
    const isSynced = credentialDeviceType === 'multiDevice';
    const deviceName = isSynced ? 'Cloud Passkey' : 'Hardware Security Key';
    const defaultNickname = `${deviceName} (${new Date().toLocaleDateString()})`;

    // create the new passkey object
    const passkey = new Passkey({
      credentialId: credential.id,
      userId,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports,
      nickname: defaultNickname,
      createdAt: Date.now(),
      deviceType: credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
    });

    // persist the passkey to the DB
    const storedPasskey = await passkey.save();

    // record security event for successful login
    try {
      await recordSecurityEvent(
        userId, 
        'passkey_registered', 
        request,
      );
    } catch (logError) {
      console.error("Failed to record passkey_registered security event", logError);
    }

    // return success response
    return NextResponse.json({
      message: "Registered new passkey successfully",
      success: true,
      storedPasskey,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to generate passkey credential creation options", routeError);
  }
}