import { authorizeRequest } from '@/helpers/util/auth-utils';
import { getErrorResponse } from '@/helpers/util/error-utils';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response

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
