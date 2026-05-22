import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { validateJSON } from "@/helpers/util/request-utils";
import { excludesSpaces, meetsMinimum, validateEmail } from "@/helpers/util/form-validation-utils";
import mongoose from "mongoose";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse, isDuplicateError } from "@/helpers/util/error-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // validate JSON
    const reqBody = await validateJSON(request);
    if (reqBody instanceof Response) return reqBody;  // return error response

    // throw if field types are invalid at runtime
    const { username, email, password } = reqBody as { username?: string; email?: string; password?: string };
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return getErrorResponse(400, "Invalid request payload");
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    // throw if valid username is not provided
    if (!normalizedUsername) {
      return getErrorResponse(400, "Invalid username");
    }

    if (!meetsMinimum(normalizedUsername, 4)) {
      return getErrorResponse(400, "Username must meet minimum character requirement");
    }

    if (!excludesSpaces(normalizedUsername)) {
      return getErrorResponse(400, "Username cannot contain spaces");
    }

    // throw if valid email is not provided
    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      return getErrorResponse(400, "Invalid email");
    }
    
    // throw if valid password is not provided
    if (!normalizedPassword) {
      return getErrorResponse(400, "Invalid password");
    }

    if (!meetsMinimum(normalizedPassword, 8)) {
      return getErrorResponse(400, "Password must meet minimum character requirement");
    }

    if (!excludesSpaces(normalizedPassword)) {
      return getErrorResponse(400, "Password cannot contain spaces");
    }

    // check for existing username or email
    const existingUsers = await User.find({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ]
    });

    const usernameInUse = existingUsers.some(
      (existingUser) => existingUser.username === normalizedUsername
    );

    const emailInUse = existingUsers.some(
      (existingUser) => existingUser.email === normalizedEmail
    );

    // throw if both already exist
    if (usernameInUse && emailInUse) {
      return getErrorResponse(409, "Username and email both in use");
    }

    // throw if username already exists
    if (usernameInUse) {
      return getErrorResponse(409, "Username already in use");
    }

    // throw if email already exists
    if (emailInUse) {
      return getErrorResponse(409, "Email already in use");
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

    // with email conflicts resolved, go ahead with creating a brand new user
    const userId = new mongoose.Types.ObjectId();
    const user = new User({
      _id: userId,
      username: normalizedUsername, 
      email: normalizedEmail, 
      password: hashedPassword,
      hasCompletedProfile: true,
      accounts: [{ 
        provider: 'credentials',
        providerId: userId.toString(),
      }],
    });

    // store user in the database
    let storedUser;
    try {
      storedUser = await user.save();

    // throw if database rejects duplicate with 11000
    } catch (dbError: unknown) {
      if (isDuplicateError(dbError)) {
        return getErrorResponse(409, "User already exists");
      }
      throw dbError;
    }

    // create sanitized user for response
    const sanitizedUser = sanitizeUser(storedUser);

    // return success response
    return NextResponse.json(
      {
        message: "User created successfully",
        success: true,
        user: sanitizedUser,
      }, 
      { status: 201 }
    );
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Unable to create user", routeError);
  }
};