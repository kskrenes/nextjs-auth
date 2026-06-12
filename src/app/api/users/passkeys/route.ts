import { connect } from "@/dbconfig/dbconfig";
import { authorizeRequest } from "@/helpers/util/auth-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import Passkey from "@/models/passkey-model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // fetch all passkeys associated with the authenticated user, sorted by creation date (newest first)
    const passkeys = await Passkey.find({ userId }).sort({ createdAt: -1 }).select('nickname createdAt lastUsed');
    const sanitizedPasskeys = passkeys.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id.toString(),
    }));

    // return success response with security logs
    return NextResponse.json({
      message: "Passkeys retrieved",
      success: true,
      passkeys: sanitizedPasskeys,
    });
  }
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to retrieve passkeys", routeError);
  }
}