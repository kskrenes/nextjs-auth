import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { getErrorResponse } from "./error-utils";

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

export const getRequestBody = async (request: NextRequest): Promise<object> => {
  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  if (!reqBody || typeof reqBody !== "object" || Array.isArray(reqBody)) {
    throw new Error("Invalid request body");
  }

  return reqBody;
}

export const validateJSON = async (request: NextRequest): Promise<object | Response> => {
  try {
    const body = await getRequestBody(request);
    return body;
  } catch(jsonError: unknown) {
    return getErrorResponse(400, "Invalid request", jsonError);
  }
}