import { NextRequest } from "next/server";
import { AuthTokenError, getIdsFromAccessToken } from "./token-utils";
import { getErrorResponse } from "./error-utils";

interface AuthContext {
  userId: string;
  sessionId: string | undefined;
}

export async function authorizeRequest(request: NextRequest): Promise<AuthContext | Response> {
  try {
    const { id: userId, sessionId } = await getIdsFromAccessToken(request);
    return { userId, sessionId };
  } catch (tokenError: unknown) {
    if (tokenError instanceof AuthTokenError) {
      return getErrorResponse(tokenError.status ?? 401, "Unauthorized", tokenError);
    }
    throw tokenError;
  }
}