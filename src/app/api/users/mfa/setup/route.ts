import { connect } from "@/dbconfig/dbconfig";
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
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: "Unauthorized" }, 
          { status: error.status ?? 401 }
        );
      }
      throw error;
    }

    // throw if authenticatedUserId does not match a user in the DB
    const user = await User.findById(authenticatedUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // throw if the user already has MFA enabled
    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "User has already enabled MFA" }, 
        { status: 409 }
      );
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
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to generate TOTP";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to generate TOTP" }, 
      { status: 500 }
    );
  }
}