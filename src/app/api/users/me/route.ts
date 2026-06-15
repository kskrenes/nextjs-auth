import { connect } from "@/dbconfig/dbconfig";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import User from "@/models/user-model";
import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { authorizeRequest } from "@/helpers/util/auth-utils";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response
    const { userId } = auth;

    // fetch the user
    const user = await User.findById(userId).select("-password");
    if (!user) return getErrorResponse(404, "User not found");

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(user);

    // return success
    return NextResponse.json({
      message: "User found",
      user: sanitizedUser,
    });
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to retrieve user", routeError);
  }
}