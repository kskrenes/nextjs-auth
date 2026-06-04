import { connect } from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import { validateRequestBody } from "@/helpers/util/request-utils";
import mongoose from "mongoose";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { getErrorResponse, isDuplicateError } from "@/helpers/util/error-utils";
import { SignUpSchema } from "@/lib/payload-schemas";
import { getIsStrongPassword } from "@/helpers/util/form-validation-utils";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // parse json, ensure it's an object, and validate all fields
    // schema ensures all values are normalized
    const validation = await validateRequestBody(request, SignUpSchema);
    if (!validation.success) return validation.errorResponse;
    const { username, email, password } = validation.data;

    // check for existing username or email
    const existingUsers = await User.find({
      $or: [
        { username },
        { email }
      ]
    });

    const usernameInUse = existingUsers.some(
      (existingUser) => existingUser.username === username
    );

    const emailInUse = existingUsers.some(
      (existingUser) => existingUser.email === email
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

    // determine password strength
    const hasStrongPassword = getIsStrongPassword(password);

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // with email conflicts resolved, go ahead with creating a brand new user
    const userId = new mongoose.Types.ObjectId();
    const user = new User({
      _id: userId,
      username, 
      email, 
      password: hashedPassword,
      hasCompletedProfile: true,
      hasStrongPassword,
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