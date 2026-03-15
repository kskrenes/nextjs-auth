import { isAxiosError } from "axios";

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