import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { getRequestBody } from "@/helpers/validate-request";
import { excludesSpaces, meetsMinimum, validateEmail } from "@/helpers/expression-validation";

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
    const { username, email, password } = reqBody as { username?: string; email?: string; password?: string };
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw if valid username is not provided
    if (!normalizedUsername) {
      return NextResponse.json(
        { error: "Invalid username" }, 
        { status: 400 }
      );
    }

    if (!meetsMinimum(normalizedUsername, 4)) {
      return NextResponse.json(
        { error: "Username must meet minimum character requirement" }, 
        { status: 400 }
      );
    }

    if (!excludesSpaces(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username cannot contain spaces" }, 
        { status: 400 }
      );
    }

    // throw if valid email is not provided
    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email" }, 
        { status: 400 }
      );
    }

    if (!excludesSpaces(normalizedEmail)) {
      return NextResponse.json(
        { error: "Email cannot contain spaces" }, 
        { status: 400 }
      );
    }
    
    // throw if valid password is not provided
    if (!normalizedPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    if (!meetsMinimum(normalizedPassword, 8)) {
      return NextResponse.json(
        { error: "Password must meet minimum character requirement" }, 
        { status: 400 }
      );
    }

    if (!excludesSpaces(normalizedPassword)) {
      return NextResponse.json(
        { error: "Password cannot contain spaces" }, 
        { status: 400 }
      );
    }

    // throw if username already exists
    const existingUsername = await User.findOne(
      { username: normalizedUsername }
    );
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already exists" }, 
        { status: 409 }
      );
    }

    // throw if user already exists
    const existingUser = await User.findOne(
      { email: normalizedEmail }
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
    const message = error instanceof Error ? error.message : "Unable to create user";
    console.error(message);
    return NextResponse.json(
      { error: "Unable to create user" }, 
      { status: 500 }
    );
  }
};