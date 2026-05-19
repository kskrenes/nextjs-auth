import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export function getErrorMessage(error: unknown, fallback: string): string {
  // use axios's isAxiosError type guard for safer error handling
  if (isAxiosError(error)) {
    // reference axios error structure or fallback
    return error.response?.data?.error || error.message;
  }
  if (error instanceof Error) {
    // standard error structure
    return error.message;
  }
  return fallback;
}

export function getErrorResponse(status: number, fallback: string, error?: unknown): Response {
  const message = status >= 500 ? fallback : getErrorMessage(error, fallback);
  console.error(error ?? message);
  return NextResponse.json(
    { error: message }, 
    { status }
  );
}