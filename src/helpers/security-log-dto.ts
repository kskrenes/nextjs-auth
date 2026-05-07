import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the seurity log fields available
const SecurityLogDTOSchema = z.object({
  userId: objectIdSchema, 
  action: z.enum([
    'login', 'password_reset', 'password_created', 'email_verified', 'profile_updated', 'google_account_linked'
  ]), 
  ipAddress: z.string(), 
  userAgent: z.string(), 
  metadata: z.object(), 
  createdAt: z.coerce.date()
});

// infer a typescript type from the zod schema
export type SecurityLogDTO = z.infer<typeof SecurityLogDTOSchema>;

// sanitize a raw security log object from the database
export function sanitizSecurityLog(securityLog: any): SecurityLogDTO {
  return SecurityLogDTOSchema.parse({
    userId: securityLog.userId.toString(), // convert ObjectId to stringå
    action: securityLog.action,
    ipAddress: securityLog.ipAddress,
    userAgent: securityLog.userAgent,
    metadata: securityLog.metadata,
    createdAt: securityLog.createdAt,
  });
}

// array variant for multiple logs
export function sanitizeSecurityLogs(securityLogs: any[]): SecurityLogDTO[] {
  return securityLogs.map(sanitizSecurityLog);
}