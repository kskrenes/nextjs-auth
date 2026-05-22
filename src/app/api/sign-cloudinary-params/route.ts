import { getErrorResponse } from '@/helpers/util/error-utils';
import { AuthTokenError, getIdsFromAccessToken } from '@/helpers/util/token-utils';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // throw if user is not authenticated
    try {
      await getIdsFromAccessToken(request);
    } catch (tokenError: unknown) {
      if (tokenError instanceof AuthTokenError) {
        return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
      }
      throw tokenError;
    }

    // throw if paramsToSign is missing or invalid
    let paramsToSign: Record<string, unknown>;
    try {
      const body = await request.json();
      if (
        !body.paramsToSign ||
        typeof body.paramsToSign !== "object" ||
        Array.isArray(body.paramsToSign)
      ) {
        return getErrorResponse(400, "Invalid paramsToSign");
      }
      paramsToSign = body.paramsToSign;
    } catch {
      return getErrorResponse(400, "Invalid request body");
    }

    // throw if secret is not configured
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!secret) {
      return getErrorResponse(500, "CLOUDINARY_API_SECRET is not configured");
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      secret
    );

    return NextResponse.json({ signature });
  } 
  catch (routeError: unknown) {
    return getErrorResponse(500, "Failed to sign Cloudinary parameters", routeError);
  }
}
