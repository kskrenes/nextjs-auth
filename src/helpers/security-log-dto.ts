import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the security log fields available
const SecurityLogDTOSchema = z.object({
  userId: objectIdSchema, 
  action: z.enum([
    'login', 'password_reset', 'password_created', 'email_verified', 'profile_updated', 'google_account_linked'
  ]), 
  ipAddress: z.string(), 
  userAgent: z.string(), 
  metadata: z.record(z.string(), z.unknown()), 
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
  metadata?: unknown;
  createdAt?: unknown;
}

// sanitize a raw security log object from the database
export function sanitizSecurityLog(securityLog: RawSecurityLog): SecurityLogDTO {
  return SecurityLogDTOSchema.parse({
    userId: securityLog.userId?.toString(), // convert ObjectId to string
    action: securityLog.action,
    ipAddress: securityLog.ipAddress,
    userAgent: securityLog.userAgent,
    metadata: securityLog.metadata,
    createdAt: securityLog.createdAt,
  });
}

// array variant for multiple logs
export function sanitizeSecurityLogs(securityLogs: RawSecurityLog[]): SecurityLogDTO[] {
  return securityLogs.map(sanitizSecurityLog);
}