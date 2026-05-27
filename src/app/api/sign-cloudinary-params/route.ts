import { authorizeRequest } from '@/helpers/util/auth-utils';
import { getErrorResponse } from '@/helpers/util/error-utils';
import { validateRequestBody } from '@/helpers/util/request-utils';
import { ParamsToSignSchema } from '@/lib/payload-schemas';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // require auth
    const auth = await authorizeRequest(request);
    if (auth instanceof Response) return auth;  // return error response

    // parse json, ensure it's an object, and validate all fields
    const validation = await validateRequestBody(request, ParamsToSignSchema);
    if (!validation.success) return validation.errorResponse;
    const { paramsToSign } = validation.data;

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
