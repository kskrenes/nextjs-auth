import { NextRequest } from "next/server";
import getUAAndIpFromRequest from "./request-headers";
import SecurityLog from "@/models/security-log-model";

export default async function recordSecurityEvent(
  userId: string, 
  action: string, 
  request: NextRequest
) {
  const { userAgent, ipAddress } = getUAAndIpFromRequest(request);
  try {
    await SecurityLog.create({
      userId,
      action,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to record security event', error);
  }
}