import { connect } from "@/dbconfig/dbconfig";
import { NextResponse, type NextRequest } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { signSessionToken, storeSessionCookie, TOKEN_COOKIE_NAME } from "@/helpers/token";
import { getRequestBody } from "@/helpers/validate-request";
import { sanitizeUser } from "@/helpers/user-dto";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if request json is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }
    
    // throw if field types are invalid at runtime
    const { email, password } = reqBody as { email?: string; password?: string };
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw if email is not provided
    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required" }, 
        { status: 400 }
      );
    }
    
    // throw if password is not provided
    if (!normalizedPassword) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // throw one error if user does not exist or if password is invalid
    // to avoid account enumeration
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    const isValidPassword = user ? await bcrypt.compare(normalizedPassword, user.password) : false;
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { status: 401 }
      );
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(user);

    // create session token
    let sessionToken;
    try {
      sessionToken = signSessionToken({
        id: sanitizedUser.id.toString(),
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
      });
    } catch (error) {
      console.error("Failed to sign session token", error);
      return NextResponse.json(
        { error: "Unable to log in" },
        { status: 500 }
      );
    }

    // create success response
    const response = NextResponse.json(
      {
        message: "Authentication successful",
        success: true,
        user: sanitizedUser,
      }, 
      { status: 200 }
    );
    
    // store token in client cookie
    storeSessionCookie(sessionToken, response);

    // return success
    return response;
  } 
  catch (error: unknown) {
    console.error(error instanceof Error ? error.message : "Unable to log in");
    return NextResponse.json(
      { error: "Unable to log in" }, 
      { status: 500 }
    );
  }
};