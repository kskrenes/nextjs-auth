import { UAParser } from 'ua-parser-js';

export default function parseUserAgent(
  userAgent: string
): { 
  deviceType: "mobile" | "desktop" | "tablet" | "unknown" | "console" | "embedded" | "smarttv" | "wearable" | "xr" | "unknown", 
  os: string, 
  browser: string 
} {
  const parser = new UAParser(userAgent);
  const deviceType = parser.getDevice().type || 'unknown';
  const os = parser.getOS().name || 'unknown';
  const browser = parser.getBrowser().name || 'unknown';

  return { deviceType, os, browser };
}