import { UAParser } from 'ua-parser-js';

export default function parseUserAgent(
  userAgent: string | undefined
): { 
  deviceType: "mobile" | "desktop" | "tablet" | "console" | "embedded" | "smarttv" | "wearable" | "xr" | "unknown", 
  os: string, 
  browser: string 
} {
  const parser = new UAParser(userAgent);
  const deviceType = parser.getDevice().type || 'unknown';
  const osName = parser.getOS().name || 'Unknown OS';
  const osVersion = parser.getOS().version;
  const browser = parser.getBrowser().name || 'Unknown Browser';
  const os = osName + (osVersion ? ` ${osVersion}` : '');

  return { deviceType, os, browser };
}