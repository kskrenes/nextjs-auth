import { AuthTokenError, getIdsFromAccessToken } from '@/helpers/token';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // throw if user is not authenticated
    try {
      await getIdsFromAccessToken(request);
    } catch (error: unknown) {
      if (error instanceof AuthTokenError) {
        return NextResponse.json(
          { error: "Unauthorized" }, 
          { status: error.status ?? 401 }
        );
      }
      throw error;
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
        return NextResponse.json(
          { error: "Invalid paramsToSign" },
          { status: 400 }
        );
      }
      paramsToSign = body.paramsToSign;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // throw if secret is not configured
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!secret) {
      console.error("CLOUDINARY_API_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      secret
    );

    return NextResponse.json({ signature });
  } catch (error: unknown) {
    console.error("Failed to sign Cloudinary params", error);
    return NextResponse.json(
      { error: "Failed to sign upload parameters" },
      { status: 500 }
    );
  }
}
