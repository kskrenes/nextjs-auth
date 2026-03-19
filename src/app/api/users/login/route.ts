import { connect } from "@/dbconfig/dbconfig";
import { NextResponse, type NextRequest } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TOKEN_COOKIE_NAME } from "@/helpers/token";
import { getRequestBody } from "@/helpers/validate-request";

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
    const user = await User.findOne({ email: normalizedEmail });
    const isValidPassword = user ? await bcrypt.compare(normalizedPassword, user.password) : false;
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { status: 401 }
      );
    }

    // throw if token secret is not configured
    const tokenSecret = process.env.JWT_SECRET;
    if (!tokenSecret) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json(
        { error: "Unable to log in" },
        { status: 500 }
      );
    }

    // create token
    const tokenData = {
      id: user._id,
      username: user.username,
      email: user.email,
    }
    const token = jwt.sign(
      tokenData, 
      tokenSecret, 
      { expiresIn: "1d" }
    );

    // store token in client cookie
    const response = NextResponse.json({
      message: "Log in successful",
      success: true,
    });
    response.cookies.set(
      TOKEN_COOKIE_NAME, 
      token, 
      { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return response;

  } catch (error: unknown) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Unable to log in" }, 
      { status: 500 }
    );
  }
};