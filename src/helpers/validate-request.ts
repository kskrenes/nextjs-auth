import { NextResponse, type NextRequest } from "next/server";

export const getRequestBody = async (request: NextRequest):Promise<object> => {
  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  if (!reqBody || typeof reqBody !== "object") {
    throw new Error("Invalid request body");
  }

  return reqBody;
}