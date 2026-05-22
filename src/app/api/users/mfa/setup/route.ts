import { connect } from "@/dbconfig/dbconfig";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { generateOtpauthUri, generateSecret } from "@/helpers/util/mfa-utils";
import { AuthTokenError, getIdsFromAccessToken } from "@/helpers/util/token-utils";
import { redis, redisKeys } from "@/lib/redis";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require authentication by validating access token
    let authenticatedUserId: string;
    try {
      ({ id: authenticatedUserId } = await getIdsFromAccessToken(request));
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // throw if authenticatedUserId does not match a user in the DB
    const user = await User.findById(authenticatedUserId);
    if (!user) {
      return getErrorResponse(404, "User not found");
    }

    // throw if the user already has MFA enabled
    if (user.mfaEnabled) {
      return getErrorResponse(409, "User has already enabled MFA");
    }

    // generate TOTP secret and URI
    const secret = generateSecret();
    const uri = generateOtpauthUri(user.email, secret);

    // store secret in Redis
    const key = redisKeys.mfaSetup(authenticatedUserId);
    const expirySeconds = 60 * 10; // expire after 10 min
    await redis.setex(key, expirySeconds, secret);

    // return success response
    return NextResponse.json({
      message: "TOTP generated",
      success: true,
      totpSecret: secret,
      totpUri: uri,
    });
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to generate TOTP", routeError);
  }
}