import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    await connect();

    const reqBody = await request.json();
    const { email, password } = reqBody;

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

    // throw if user does not exist
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // throw if invalid password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid password" }, 
        { status: 400 }
      );
    }

    // create token
    const tokenData = {
      id: user._id,
      username: user.username,
      email: user.email,
    }
    const token = await jwt.sign(
      tokenData, process.env.TOKEN_SECRET!, 
      { expiresIn: "1d" }
    );

    // store token in client cookie
    const response = NextResponse.json({
      message: "Log in successful",
      success: true,
    });
    response.cookies.set("token", token, { httpOnly: true });

    return response;

  } catch (error: unknown) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Unable to log in" }, 
      { status: 500 }
    );
  }
};