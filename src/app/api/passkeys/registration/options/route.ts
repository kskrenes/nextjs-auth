import { connect } from "@/dbconfig/dbconfig";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { NextRequest, NextResponse } from "next/server";
import Passkey from "@/models/passkey-model";
import { generateRegistrationOptions } from '@simplewebauthn/server';
import User from "@/models/user-model";
import { storePasskeyChallenge, storePasskeyChallengeToken } from "@/helpers/util/passkey-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // ensure necessary environment variables are configured
    const rpName = process.env.APP_DISPLAY_NAME;
    const rpID = process.env.APP_HOSTNAME;
    if (!rpName || !rpID) return getErrorResponse(500, "Server configuration error");

    // fetch the authorized user (require only username, name fields)
    const user = await User.findById(userId).select('username name');
    if (!user) return getErrorResponse(404, 'No user found matching the authenticated ID');

    // fetch all passkeys for the user, sorted by creation date (newest first)
    const passkeys = await Passkey.find({ userId }).sort({ createdAt: -1 });
    if (!Array.isArray(passkeys)) return getErrorResponse(401, 'Failed to retrieve passkeys for this user');

    // map passkeys to the appropriate format for SimpleWebAuthn
    const excludeCredentials = passkeys.map(passkey => ({
      id: passkey.credentialId,
      type: 'public-key' as const,
      transports: passkey.transports,
    }));

    // generate registration options with SimpleWebAuthn
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      userDisplayName: user.name,
      userID: user._id,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      excludeCredentials,
    });

    // store the options challenge in Redis
    const regToken = await storePasskeyChallenge(options.challenge, 'REGISTRATION', userId)

    // create the success response
    const response = NextResponse.json({
      message: "Generated passkey credential creation options successfully",
      success: true,
      options,
    });
    
    // set the challenge token cookie
    storePasskeyChallengeToken(response, regToken, 'REGISTRATION');

    // return the response
    return response;
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to generate passkey credential creation options", routeError);
  }
}