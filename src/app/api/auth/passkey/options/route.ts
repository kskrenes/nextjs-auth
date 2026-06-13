import { getErrorResponse } from "@/helpers/util/error-utils";
import { storePasskeyChallenge, storePasskeyChallengeToken } from "@/helpers/util/passkey-utils";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // ensure necessary environment variables are configured
    const rpID = process.env.APP_HOSTNAME;
    if (!rpID) return getErrorResponse(500, "Server configuration error");

    // generate authentication options with SimpleWebAuthn
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: [], // empty to support discoverable credentials
    });

    // store the options challenge in Redis
    const authToken = await storePasskeyChallenge(options.challenge, 'AUTHENTICATION');

    // create success response
    const response = NextResponse.json(
      {
        message: "Generated passkey authentication options successfully",
        success: true,
        options,
      }, 
      { status: 200 }
    );
        
    // set the challenge token cookie
    storePasskeyChallengeToken(response, authToken, 'AUTHENTICATION');
    
    // return success response
    return response;
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to generate passkey authentication options", routeError);
  }
};