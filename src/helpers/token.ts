import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const TOKEN_COOKIE_NAME = "naetoken" as const;

export const getIdFromToken = async (request: NextRequest) => {
  try {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value || "";
    // TODO: fix this typing to be more robust and include the id property
    const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decodedToken.id;
  } catch (error: any) {
    // TODO: type error appropriately or use type guards
    throw new Error(error.message);
  }
}