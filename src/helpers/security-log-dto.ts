import mongoose from 'mongoose';
import { z } from 'zod';
import { activityConfig } from './activity-config';

const activityActions = Object.keys(activityConfig) as [string, ...string[]];

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the security log fields available
const SecurityLogDTOSchema = z.object({
  userId: objectIdSchema, 
  action: z.enum(activityActions), 
  ipAddress: z.string().max(64).optional(), 
  userAgent: z.string().max(512).optional(), 
  createdAt: z.coerce.date()
});

// infer a typescript type from the zod schema
export type SecurityLogDTO = z.infer<typeof SecurityLogDTOSchema>;

// define a minimal interface for the raw security log
interface RawSecurityLog {
  userId?: { toString(): string } | string;
  action?: unknown;
  ipAddress?: unknown;
  userAgent?: unknown;
  createdAt?: unknown;
}

// sanitize a raw security log object from the database
export function sanitizeSecurityLog(securityLog: RawSecurityLog): SecurityLogDTO {
  return SecurityLogDTOSchema.parse({
    userId: securityLog.userId?.toString(), // convert ObjectId to string
    action: securityLog.action,
    ipAddress: securityLog.ipAddress,
    userAgent: securityLog.userAgent,
    createdAt: securityLog.createdAt,
  });
}

// array variant for multiple logs
export function sanitizeSecurityLogs(securityLogs: RawSecurityLog[]): SecurityLogDTO[] {
  return securityLogs.flatMap((securityLog) => {
    const parsed = SecurityLogDTOSchema.safeParse({
      userId: securityLog.userId?.toString(),
      action: securityLog.action,
      ipAddress: securityLog.ipAddress,
      userAgent: securityLog.userAgent,
      createdAt: securityLog.createdAt,
    });
    return parsed.success ? [parsed.data] : [];
  });
}