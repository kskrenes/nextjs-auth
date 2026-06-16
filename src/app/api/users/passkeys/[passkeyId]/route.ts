import { connect } from "@/dbconfig/dbconfig";
import { sanitizePasskey } from "@/helpers/dto/passkey-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { RawUser, sanitizeUser } from "@/helpers/dto/user-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validatePayload, validateRequestBody } from "@/helpers/util/request-utils";
import { PasskeyParamsSchema, UpdatePasskeySchema } from "@/lib/payload-schemas";
import Passkey from "@/models/passkey-model";
import User from "@/models/user-model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ passkeyId: string }> }
) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // validate params
    const resolvedParams = await params;
    const paramValidation = validatePayload(PasskeyParamsSchema, resolvedParams, 400);
    if (!paramValidation.success) return paramValidation.errorResponse;
    const { passkeyId } = paramValidation.data;

    // parse json, ensure it's an object, and validate all fields
    const jsonValidation = await validateRequestBody(request, UpdatePasskeySchema);
    if (!jsonValidation.success) return jsonValidation.errorResponse;
    const { nickname } = jsonValidation.data;

    // update the passkey
    const passkey = await Passkey.findOneAndUpdate(
      { _id: passkeyId, userId },
      { nickname },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).select('nickname createdAt lastUsed');
    if (!passkey) return getErrorResponse(404, 'Unable to find passkey');

    // sanitize passkey for the UI
    const sanitizedPasskey = sanitizePasskey(passkey);
    
    // return success response
    return NextResponse.json({
      message: "Passkey updated successfully",
      success: true,
      passkey: sanitizedPasskey,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to update passkey", routeError);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ passkeyId: string }> }
) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // validate params
    const resolvedParams = await params;
    const validation = validatePayload(PasskeyParamsSchema, resolvedParams, 400);
    if (!validation.success) return validation.errorResponse;
    const { passkeyId } = validation.data;

    // use mongoose session.withTransaction to perform one atomic operation across separate collections
    const session = await mongoose.startSession();
    let user: RawUser | null = null;

    try {
      await session.withTransaction(async () => {
        // delete the passkey
        await Passkey.deleteOne({ _id: passkeyId, userId }, { session });

        // atomically decrement the user's passkey count
        user = await User.findByIdAndUpdate(
          userId,
          { $inc: { passkeyCount: -1 } },
          { returnDocument: "after", runValidators: true, session }
        );
        if (!user) throw new Error("Unable to update User document after deleting passkey");
      });
    } finally {
      await session.endSession();
    }

    // sanitize the user document for the UI
    const sanitizedUser = sanitizeUser(user!);

    // record security event for successful passkey delete
    try {
      await recordSecurityEvent(
        userId, 
        'passkey_deleted', 
        request,
      );
    } catch (logError) {
      console.error("Failed to record passkey_deleted security event", logError);
    }
    
    // return success response
    return NextResponse.json({
      message: "Passkey deleted successfully",
      success: true,
      user: sanitizedUser,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to delete passkey", routeError);
  }
}