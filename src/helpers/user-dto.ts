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
  ]).optional()).optional(),
  avatarId: z.string().optional(),
  hasCompletedProfile: z.boolean(),
  isVerified: z.boolean(),
  isAdmin: z.boolean(),
  linkedProviders: z.array(z.enum([
    "credentials", 
    "google"]
  ).optional())
});

// infer a typescript type from the zod schema
export type UserDTO = z.infer<typeof UserDTOSchema>;

// sanitize a raw user object from the database
export function sanitizeUser(user: any): UserDTO {
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
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
    linkedProviders: (user.accounts ?? []).map(
      (a: { provider: string }) => a.provider
    ),
  });
}