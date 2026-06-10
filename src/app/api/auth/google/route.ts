import { validateRequestBody } from "@/helpers/util/request-utils";
import User from "@/models/user-model";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { 
  createSession, 
  getIdsFromAccessToken, 
  signAccessToken, 
  storeAccessTokenCookie, 
  storeRefreshTokenCookie, 
  storeSessionHintCookie 
} from "@/helpers/util/token-utils";
import { connect } from "@/dbconfig/dbconfig";
import { sanitizeUser } from "@/helpers/dto/user-dto";
import { recordSecurityEvent } from "@/helpers/dto/security-log-dto";
import { SecurityEventType } from "@/helpers/util/security-event-utils";
import { getErrorResponse, isDuplicateError } from "@/helpers/util/error-utils";
import { initiateMfaChallenge } from "@/helpers/util/mfa-utils";
import { GoogleTokenSchema } from "@/lib/payload-schemas";

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
  let successMessage = 'Authentication successful';
  let securityLogAction: SecurityEventType = "login";
  try {
    await connect();

    // parse json, ensure it's an object, and validate all properties
    const validation = await validateRequestBody(request, GoogleTokenSchema);
    if (!validation.success) return validation.errorResponse;
    const { token } = validation.data;

    // throw if google client id is not configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return getErrorResponse(500, "Server configuration error");
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
      return getErrorResponse(401, "Invalid token payload");
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

      // check if user has MFA enabled
      if (storedUser.mfaEnabled === true) {
        const mfaChallenge = await initiateMfaChallenge(storedUser);
        return mfaChallenge;
      }
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    // if no match, it's a new google sign in
    if (!storedUser) {

      // check if the user has an authorized session
      let sessionUserId: string | undefined;
      try {
        ({ id: sessionUserId } = await getIdsFromAccessToken(request));
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
          return getErrorResponse(409, "Google email must match account email");
        }

        storedUser = updatedUser;
        successMessage = 'Account linked successfully';
        securityLogAction = "google_account_linked";
      }
      else {
        // create a new user with google account provider
        const username = await createUniqueUsername(name, email);
      
        const newUser = new User({
          username, 
          email: normalizedEmail, 
          name,
          hasCompletedProfile: false,
          hasStrongPassword: true,  // set to true (ony on first google login with no other credentials) to avoid penalizing health score
          accounts: [{ 
            provider: 'google',
            providerId: sub,
          }],
          isVerified: email_verified,
        });

        // store user in the database
        try {
          storedUser = await newUser.save();

        // throw if database rejects duplicate with 11000
        } catch (dbError: unknown) {
          if (isDuplicateError(dbError)) {
            // most likely the account exists but has not linked their google account
            return getErrorResponse(409, "User already exists", dbError);
          }
          throw dbError;
        }

        // ensure cloudinary url configuration before attempting to import avatar
        const cloudinaryUrl = process.env.CLOUDINARY_URL;
        if (!cloudinaryUrl) {
          console.error("Cloudinary URL not configured, cannot import Google avatar");
        } else {
          // import the avatar from Google
          if (picture && typeof picture === 'string') {
            try {
              const avatarId = await getAvatarId(picture);
              storedUser.avatarId = avatarId;
              await storedUser.save();
            } catch (avatarError) {
              console.error("Failed to import Google avatar", avatarError);
            }
          }
        }
      }
    }

    // build sanitized user
    const sanitizedUser = sanitizeUser(storedUser);
        
    // store a new session document
    let refreshToken;
    let newSessionId;
    try {
      ({ refreshToken, sessionId: newSessionId } = await createSession(sanitizedUser, request));
    } catch(sessionError) {
      return getErrorResponse(500, "Failed to create session document", sessionError);
    }

    // create access token
    let accessToken;
    try {
      accessToken = signAccessToken({
        id: sanitizedUser.id.toString(),
        username: sanitizedUser.username,
        email: sanitizedUser.email,
        hasCompletedProfile: sanitizedUser.hasCompletedProfile,
        sessionId: newSessionId,
      });
    } catch (tokenError) {
      return getErrorResponse(500, "Failed to sign access token", tokenError);
    }

    // record security event for successful login or account linking
    try {
      await recordSecurityEvent(
        sanitizedUser.id, 
        securityLogAction, 
        request,
      );
    } catch (logError) {
      console.error(`Failed to record ${securityLogAction} security event`, logError);
    }

    // create success response
    const response = NextResponse.json(
      {
        message: successMessage,
        success: true,
        user: sanitizedUser,
      }, 
      { status: 200 }
    );
        
    // store access and refresh tokens in separate cookies
    storeAccessTokenCookie(accessToken, response);
    storeRefreshTokenCookie(refreshToken, response);
    storeSessionHintCookie(response);

    // return success
    return response;
  } 
  catch (routeError) {
    return getErrorResponse(500, "Unable to log in", routeError);
  }
}