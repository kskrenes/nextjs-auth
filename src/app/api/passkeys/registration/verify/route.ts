import { connect } from "@/dbconfig/dbconfig";
import { sanitizePasskey } from "@/helpers/dto/passkey-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { claimChallenge, getPasskeyChallengeToken } from "@/helpers/util/passkey-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { PasskeyRegistrationVerificationSchema } from "@/lib/payload-schemas";
import Passkey from "@/models/passkey-model";
import User from "@/models/user-model";
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
    const validation = await validateRequestBody(request, PasskeyRegistrationVerificationSchema);
    if (!validation.success) return validation.errorResponse;
    const { attestationResponse } = validation.data;

    // ensure necessary environment variables are configured
    const origin = process.env.APP_ORIGIN;
    const rpID = process.env.APP_HOSTNAME;
    if (!origin || !rpID) return getErrorResponse(500, "Server configuration error");

    // read the challenge token from the cookie
    const regToken = getPasskeyChallengeToken(request, 'REGISTRATION');
    if (!regToken) return getErrorResponse(400, 'Unable to read passkey registration challenge token');

    // atomically claim the token from Redis
    const challenge = await claimChallenge(regToken, 'REGISTRATION', userId);
    if (!challenge) return getErrorResponse(400, 'Unable to retrieve passkey registration challenge');

    // verify the registration challenge
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!verification.verified) return getErrorResponse(400, 'Unable to verify passkey registration challenge');

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
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
      nickname: defaultNickname,
      createdAt: Date.now(),
      deviceType: credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
    });

    // persist the passkey to the DB
    const storedPasskey = await passkey.save();
    if (!storedPasskey) return getErrorResponse(400, 'Unable to create passkey');

    // sanitize the passkey for the UI
    const sanitizedPasskey = sanitizePasskey(storedPasskey);

    // update the user's hasPasskey flag
    const user = await User.findByIdAndUpdate(
      userId,
      { hasPasskey: true },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
    if (!user) console.error("Unable to update User document when registering passkey");
    const sanitizedUser = sanitizeUser(user);

    // record security event for passkey registration
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
      message: "Passkey successfully registered",
      success: true,
      passkey: sanitizedPasskey,
      user: sanitizedUser,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to verify passkey registration response", routeError);
  }
}