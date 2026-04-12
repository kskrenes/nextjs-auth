import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-model";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import jwt from "jsonwebtoken";
import { signSessionToken, storeSessionCookie, TOKEN_COOKIE_NAME } from "@/helpers/token";

function createUsername(name: string, email: string) {
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let prefix = name.toLowerCase().replace(/\s+/g, '');
  if (!prefix) {
    prefix = email.split('@')[0];
  }
  return prefix + suffix;
}

async function getAvatarId(url: string) {
  const uploadResponse = await cloudinary.uploader.upload(url, { overwrite: true });
  return uploadResponse.public_id;
}

export async function POST(request: NextRequest) {
  try {
    // throw if request json is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: unknown) {
      console.error("Invalid request");
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid request" }, 
        { status: 400 }
      );
    }

    // throw if field types are invalid at runtime
    const { token } = reqBody as { token?: string; };
    if (typeof token !== "string") {
      console.error("Invalid request");
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // throw if google client id is not configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // verify the ID Token with google
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // throw if invalid payload
    if (
      !payload ||
      !payload.sub ||
      typeof payload.sub !== "string" ||
      !payload.email ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      console.error("Invalid token payload");
      return NextResponse.json(
        { error: 'Invalid token payload' }, 
        { status: 401 }
      );
    }

    const { sub, email, name, picture, email_verified } = payload;

    // find existing user
    let storedUser = await User.findOne({ 'accounts.providerId': sub });
    
    // create and insert new user if none exists
    if (!storedUser) {
      const username = createUsername(name, email);
      const normalizedEmail = email.trim().toLowerCase();
      
      const newUser = new User({
        username, 
        email: normalizedEmail, 
        name,
        hasCompletedProfile: false,
        accounts: [{ 
          provider: 'google',
          providerId: sub,
        }],
        isVerified: email_verified,
      });

      if (picture && typeof picture === 'string') {
        newUser.avatarId = await getAvatarId(picture);
      }

      // store user in the database
      try {
        storedUser = await newUser.save();

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
    }

    // create sanitized user for response
    const sanitizedUser = {
      _id: storedUser._id,
      username: storedUser.username,
      email: storedUser.email,
      name: storedUser.name,
      company: storedUser.company,
      website: storedUser.website,
      socialLinks: storedUser.socialLinks,
      avatarId: storedUser.avatarId,
      hasCompletedProfile: storedUser.hasCompletedProfile,
      isVerified: storedUser.isVerified,
      isAdmin: storedUser.isAdmin,
    };

    // create session token
    let sessionToken;
    try {
      sessionToken = signSessionToken({
        id: sanitizedUser._id,
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Unable to log in" },
        { status: 500 }
      );
    }
    
    // create success response
    const response = NextResponse.json(
      {
        message: 'Authentication successful',
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
  catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to log in");
    return NextResponse.json(
      { error: "Unable to log in" }, 
      { status: 500 }
    );
  }
}