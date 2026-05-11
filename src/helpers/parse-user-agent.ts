import { UAParser } from 'ua-parser-js';

export default function parseUserAgent(
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