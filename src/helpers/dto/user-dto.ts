import mongoose from 'mongoose';
import 'server-only'; // do not allow this file to be used by the client
import { z } from 'zod';

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the user fields available to the UI
const UserDTOSchema = z.object({
  id: objectIdSchema,
  username: z.string(),
  email: z.email(),
  name: z.string().optional(),
  company: z.string().optional(),
  website: z.union([
    z.url(),
    z.literal(""),
  ]).optional(),
  socialLinks: z.array(z.union([
    z.url(),
    z.literal(""),
  ])).optional(),
  avatarId: z.string().optional(),
  hasCompletedProfile: z.boolean(),
  hasStrongPassword: z.boolean(),
  passkeyCount: z.number(),
  isVerified: z.boolean(),
  isAdmin: z.boolean(),
  linkedProviders: z.array(z.enum([
    "credentials", 
    "google"
  ])),
  mfaEnabled: z.boolean(),
});

// infer a typescript type from the zod schema
export type UserDTO = z.infer<typeof UserDTOSchema>;

// define a minimal interface for the raw user
export interface RawUser {
  _id: { toString(): string } | string;
  username: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  socialLinks?: string[];
  avatarId?: string;
  hasCompletedProfile: boolean;
  hasStrongPassword?: boolean;
  passkeyCount?: number;
  isVerified: boolean;
  isAdmin: boolean;
  accounts?: { provider: string }[];
  mfaEnabled?: boolean;
}

// sanitize a raw user object from the database
export function sanitizeUser(user: RawUser): UserDTO {
  return UserDTOSchema.parse({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    name: user.name,
    company: user.company,
    website: user.website,
    socialLinks: user.socialLinks,
    avatarId: user.avatarId,
    hasCompletedProfile: user.hasCompletedProfile,
    hasStrongPassword: user.hasStrongPassword ?? false,
    passkeyCount: user.passkeyCount ?? 0,
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
    linkedProviders: (user.accounts ?? []).map(
      (a: { provider: string }) => a.provider
    ),
    mfaEnabled: user.mfaEnabled ?? false,
  });
}