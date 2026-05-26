import { UAParser } from "ua-parser-js";
import { getErrorResponse } from "./error-utils";
import { ZodType } from "zod";

export function getUAAndIpFromRequest(request: Request): { userAgent: string; ipAddress: string } {
  const userAgent = request.headers.get('user-agent') || '';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = 
    forwardedFor?.split(',')[0].trim() || 
    request.headers.get('x-real-ip')?.trim() || 
    'Unknown';
    
  return { userAgent, ipAddress };
}

export function parseUserAgent(
  userAgent: string | undefined
): { 
  deviceType: "mobile" | "desktop" | "tablet" | "console" | "embedded" | "smarttv" | "wearable" | "xr" | "unknown", 
  os: string, 
  browser: string 
} {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const osInfo = parser.getOS();
  const browserInfo = parser.getBrowser();

  const osName = osInfo.name || 'Unknown OS';
  const browser = browserInfo.name || 'Unknown Browser';
  const osVersion = osInfo.version;

  // combine os name and version, if version is available
  const os = osName + (osVersion ? ` ${osVersion}` : '');

  // infer desktop device type, since getDevice().type returns undefined for desktop
  const deviceType = device.type ?? (osInfo.name || browserInfo.name ? 'desktop' : 'unknown');

  return { deviceType, os, browser };
}

type ValidationResult<T> = 
  | { success: false; errorResponse: Response } 
  | { success: true; data: T };

export function validatePayload<T>(
  schema: ZodType<T>, 
  data: unknown, 
  statusCode = 400
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // extract the first validation error message defined in the schema
    const firstIssue = result.error.issues[0];
    const errorMessage = firstIssue.message ?? "Invalid request payload";
    
    return { 
      success: false, 
      errorResponse: getErrorResponse(statusCode, errorMessage)
    };
  }
  
  return { success: true, data: result.data };
}

export async function validateRequestBody<T>(
  request: Request, 
  schema: ZodType<T>, 
  statusCode = 400
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validatePayload(schema, body, statusCode);
  } catch {
    return { 
      success: false, 
      errorResponse: getErrorResponse(400, "Invalid JSON body") 
    };
  }
}