import { connect } from "@/dbconfig/dbconfig";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { generateBackupCodes, hashBackupCode, verifyBackupCode, verifyTotpCode } from "@/helpers/util/mfa-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { MFACodeSchema } from "@/lib/payload-schemas";
import User from "@/models/user-model";
import mongoose from "mongoose";
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

    // fetch user from DB with mfaSecret included
    let user;
    try {
      user = await User.findById(userId).select('+mfaSecret +mfaBackupCodes');
    } catch (dbError) {
      return getErrorResponse(500, "Database error", dbError);
    }

    // ensure a DB match was found and user still has mfa enabled
    if (!user || !user.mfaEnabled) {
      return getErrorResponse(404, "User not found");
    }

    // check if code is a TOTP code or backup code
    const isTotp = await verifyTotpCode(user.mfaSecret, code);
    if (!isTotp) {
      const backups = user.mfaBackupCodes;
      const codeIndex = verifyBackupCode(code, backups);
      if (typeof codeIndex !== 'number') {
        // invalid code
        return getErrorResponse(400, "Invalid TOTP or backup code");
      }
    }

    // generate and hash backup codes for storage
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((buCode) => hashBackupCode(buCode));

    // update the user document in the DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
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

    // return success response
    return NextResponse.json({
      message: "Backup codes generated",
      success: true,
      backupCodes,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Failed to generate new backup codes", routeError);
  }
}

interface AggregateResult {
  _id: string;
  arrayLength: number;
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // use aggregate to retrieve just the length integer
    const result = await User.aggregate<AggregateResult>([
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(userId),
          mfaEnabled: true,
        } 
      },
      { 
        $project: { 
          arrayLength: { 
            $size: {
              $ifNull: ["$mfaBackupCodes", []]
            }
          } 
        } 
      }
    ]);

    if (!result[0]) {
      return getErrorResponse(404, "User not found");
    }

    const count = result[0].arrayLength;

    // return success response
    return NextResponse.json({
      message: "Backup code count retrieved",
      success: true,
      count,
    });
  } 
  catch (routeError) {
    return getErrorResponse(500, "Failed to retrieve backup codes", routeError);
  }
}