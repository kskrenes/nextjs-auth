import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";

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

    const { username, email, password } = reqBody as { username?: string; email?: string; password?: string };

    // throw if username is not provided
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" }, 
        { status: 400 })
      ;
    }

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

    // throw if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" }, 
        { status: 409 }
      );
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create new user
    const user = new User({
      username, 
      email, 
      password: hashedPassword,
    });

    // store user in the database
    const storedUser = await user.save();

    // return sanitized user
    return NextResponse.json({
      message: "User created successfully",
      success: true,
      user: {
        id: storedUser._id,
        username: storedUser.username,
        email: storedUser.email,
        isVerified: storedUser.isVerified,
        isAdmin: storedUser.isAdmin,
      },
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("Signup route error:", error);
    return NextResponse.json(
      { error: "Unable to create user" }, 
      { status: 500 }
    );
  }
};