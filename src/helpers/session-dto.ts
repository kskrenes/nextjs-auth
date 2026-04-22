import mongoose from 'mongoose';
import 'server-only'; // do not allow this file to be used by the client
import { z } from 'zod';

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the user fields available to the UI
const SessionDTOSchema = z.object({
  sessionId: z.uuid(),
  userId: objectIdSchema,
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  expiresAt: z.date(),
  lastActive: z.date()
});

// infer a typescript type from the zod schema
export type SessionDTO = z.infer<typeof SessionDTOSchema>;

// sanitize a raw session object from the database
export function sanitizeSession(session: any): SessionDTO {
  return SessionDTOSchema.parse({
    sessionId: session.sessionId,
    userId: session.userId.toString(),
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    lastActive: session.lastActive,
  });
}