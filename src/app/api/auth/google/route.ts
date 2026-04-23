import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-model";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { createSession, getIdFromToken, signAccessToken, storeAccessTokenCookie, storeRefreshTokenCookie } from "@/helpers/token";
import { connect } from "@/dbconfig/dbconfig";
import { sanitizeUser } from "@/helpers/user-dto";

const createUniqueUsername = async (name: string, email: string): Promise<string> => {
  // generate a base username from the name or email
  let prefix = name.toLowerCase().replace(/\s+/g, '');
  if (!prefix) {
    prefix = email.split('@')[0].toLowerCase();
  }

  // append a random 4-digit alphanumeric suffix
  const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const SUFFIX_LEN = 4;
  const MAX_ATTEMPTS = 10;  // short circuit to avoid infinite loop in case of high collision

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    let suffix = '';
    for (let j = 0; j < SUFFIX_LEN; j++) {
      suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    const candidate = prefix + suffix;
    const exists = await User.exists({ username: candidate });

    // return the first candidate that doesn't exist in the database
    if (!exists) return candidate;
  }

  // last-resort fallback if we hit too many collisions
  return prefix + Date.now().toString(36);
}

async function getAvatarId(url: string) {
  const uploadResponse = await cloudinary.uploader.upload(url, { overwrite: true });
  return uploadResponse.public_id;
}

export async function POST(request: NextRequest) {
  try {
    await connect();

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
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // verify the ID Token with google
    const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // throw if invalid payload
    if (
      !payload ||
      !payload.sub ||
      typeof payload.sub !== "string" ||
      !payload.email ||
      typeof payload.email !== "string"
    ) {
      console.error("Invalid token payload");
      return NextResponse.json(
        { error: 'Invalid token payload' }, 
        { status: 401 }
      );
    }

    const { sub, email, picture, email_verified } = payload;
    const name = typeof payload.name === "string" ? payload.name : "";

    // find existing user
    let storedUser = await User.findOne({
      accounts: {
        $elemMatch: {
          provider: "google",
          providerId: sub,
        },
      },
    });

    if (storedUser) {
      // upgrade isVerified if Google now says the email is verified
      if (!storedUser.isVerified && email_verified) {
        storedUser.isVerified = true;
        await storedUser.save();
      }
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    // if no match, it's a new google sign in
    if (!storedUser) {

      // check if the user has an authorized session
      let sessionUserId: string | undefined;
      try {
        sessionUserId = await getIdFromToken(request);
      } catch {
        // ignore errors and fall through to new user flow
      }

      // if authed, attempt to link google account
      if (sessionUserId) {
        // if ids and emails match, update user
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: sessionUserId,
            email: normalizedEmail,
          },
          {
            $push: {
              accounts: {
                provider: "google",
                providerId: sub,
              },
            }
          },
          { returnDocument: 'after' }
        );

        // if no user was found, current session user has a different email
        if (!updatedUser) {
          return NextResponse.json(
            { error: "Google email must match account email" },
            { status: 409 }
          );
        }

        // build sanitized user
        const sanitizedUser = sanitizeUser(updatedUser);
        
        // store a new session document
        let refreshToken;
        try {
          refreshToken = await createSession(sanitizedUser, request);
        } catch(error) {
          console.error("Failed to create session document", error);
          return NextResponse.json(
            { error: "Unable to log in" },
            { status: 500 }
          );
        }

        // create access token
        let accessToken;
        try {
          accessToken = signAccessToken({
            id: sanitizedUser.id.toString(),
            username: sanitizedUser.username,
            email: sanitizedUser.email,
            hasCompletedProfile: sanitizedUser.hasCompletedProfile,
          });
        } catch (error) {
          console.error("Failed to sign access token", error);
          return NextResponse.json(
            { error: "Unable to log in" },
            { status: 500 }
          );
        }

        // create success response
        const response = NextResponse.json(
          {
            message: 'Account linked successfully',
            success: true,
            user: sanitizedUser,
          }, 
          { status: 200 }
        );
        
        // store access and refresh tokens in separate cookies
        storeAccessTokenCookie(accessToken, response);
        storeRefreshTokenCookie(refreshToken, response);

        // return success
        return response;
      }
      
      const username = await createUniqueUsername(name, email);
    
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

      // ensure cloudinary url configuration before attempting to import avatar
      const cloudinaryUrl = process.env.CLOUDINARY_URL;
      if (!cloudinaryUrl) {
        console.error("Cloudinary URL not configured, cannot import Google avatar");
      } else {
        // import the avatar from Google
        if (picture && typeof picture === 'string') {
          try {
            newUser.avatarId = await getAvatarId(picture);  
          } catch (error) {
            console.error("Failed to import Google avatar", error);
          }
        }
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

    // build sanitized user
    const sanitizedUser = sanitizeUser(storedUser);
        
    // store a new session document
    let refreshToken;
    try {
      refreshToken = await createSession(sanitizedUser, request);
    } catch(error) {
      console.error("Failed to create session document", error);
      return NextResponse.json(
        { error: "Unable to log in" },
        { status: 500 }
      );
    }

    // create access token
    let accessToken;
    try {
      accessToken = signAccessToken({
        id: sanitizedUser.id.toString(),
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
      });
    } catch (error) {
      console.error("Failed to sign access token", error);
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
        
    // store access and refresh tokens in separate cookies
    storeAccessTokenCookie(accessToken, response);
    storeRefreshTokenCookie(refreshToken, response);

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