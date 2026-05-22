import { connect } from "@/dbconfig/dbconfig";
import { getIdsFromAccessToken } from "@/helpers/util/token-utils";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import User from "@/models/user-model";
import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/helpers/util/error-utils";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // fetch user associated with token
    const { id } = await getIdsFromAccessToken(request);
    const user = await User.findById(id)
      .select("-password");

    // throw if user not found
    if (!user) {
      return getErrorResponse(404, "User not found");
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(user);

    // return success
    return NextResponse.json({
      message: "User found",
      user: sanitizedUser,
    });
  } 
  catch (routeError: unknown) {
    // check for authorization error
    if (routeError instanceof Error && /token|jwt|auth/i.test(routeError.message)) {
      return getErrorResponse(401, "Unauthorized");
    }
    return getErrorResponse(500, "Unable to retrieve user", routeError);
  }
}