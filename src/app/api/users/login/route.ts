import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // throw if request json is invalid
    let reqBody: unknown;
    try {
      reqBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!reqBody || typeof reqBody !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = reqBody as { email?: string; password?: string };

    // throw if email is not provided
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" }, 
        { status: 400 }
      );
    }
    
    // throw if password is not provided
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // throw one error if user does not exist or if password is invalid
    // to avoid account enumeration
    const user = await User.findOne({ email });
    const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // throw if token secret is not configured
    const tokenSecret = process.env.TOKEN_SECRET;
    if (!tokenSecret) {
      console.error("TOKEN_SECRET is not configured");
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
      "token", 
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