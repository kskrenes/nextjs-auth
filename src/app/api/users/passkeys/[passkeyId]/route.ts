import { connect } from "@/dbconfig/dbconfig";
import { sanitizePasskey } from "@/helpers/dto/passkey-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validatePayload, validateRequestBody } from "@/helpers/util/request-utils";
import { PasskeyParamsSchema, UpdatePasskeySchema } from "@/lib/payload-schemas";
import Passkey from "@/models/passkey-model";
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

    // delete passkey
    const passkey = await Passkey.findOneAndDelete({ _id: passkeyId, userId });
    if (!passkey) return getErrorResponse(404, 'No passkey found');

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
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to delete passkey", routeError);
  }
}