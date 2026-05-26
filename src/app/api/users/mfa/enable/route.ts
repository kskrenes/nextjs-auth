import { connect } from "@/dbconfig/dbconfig";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { generateBackupCodes, hashBackupCode, verifyTotpCode } from "@/helpers/util/mfa-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { MFACodeSchema } from "@/lib/payload-schemas";
import { redis, redisKeys } from "@/lib/redis";
import User from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;
    
    // parse json, ensure it's an object, and validate all fields
    const validation = await validateRequestBody(request, MFACodeSchema);
    if (!validation.success) return validation.errorResponse;
    const { code } = validation.data;

    // retrieve pending secret from Redis
    const key = redisKeys.mfaSetup(userId);
    const secret = await redis.get<string>(key);
    if (!secret || typeof secret !== "string" || secret.length === 0) {
      return getErrorResponse(400, "Invalid TOTP secret");
    }

    // verify the TOTP code
    const codeIsValid = await verifyTotpCode(secret, code);
    if (!codeIsValid) {
      return getErrorResponse(400, "Invalid TOTP code");
    }

    // generate and hash backup codes for storage
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((buCode) => hashBackupCode(buCode));

    // update the user document in the DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: hashedBackupCodes
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
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
        "mfa_enabled", 
        request,
      );
    } catch (logError) {
      console.error("Failed to record mfa_enabled security event", logError);
    }

    // delete the Redis setup key
    try {
      await redis.del(key);  
    } catch (cleanupError) {
      console.error("Failed to clear pending MFA setup key", cleanupError);
    }

    // return success response
    return NextResponse.json({
      message: "MFA enabled",
      success: true,
      user: sanitizedUser,
      backupCodes
    });
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Failed to enable MFA", routeError);
  }
}