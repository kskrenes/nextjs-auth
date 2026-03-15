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

    // typescript only enforces field types at compile-time...
    const { username, email, password } = reqBody as { username?: string; email?: string; password?: string };

    // throw if field types are invalid at runtime
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Username, email, and password must be strings" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw if username is not provided
    if (!normalizedUsername) {
      return NextResponse.json(
        { error: "Username is required" }, 
        { status: 400 })
      ;
    }

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

    // throw if user already exists
    const existingUser = await User.findOne(
      { $or: [
        { email: normalizedEmail }, 
        { username: normalizedUsername }
      ]}
    );
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" }, 
        { status: 409 }
      );
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

    // create new user
    const user = new User({
      username: normalizedUsername, 
      email: normalizedEmail, 
      password: hashedPassword,
    });

    // store user in the database
    let storedUser;
    try {
      storedUser = await user.save();

    // throw if database rejects duplicate with 11000
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

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