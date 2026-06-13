import mongoose, { ObjectId } from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid Mongoose ObjectId" }
);

// define the passkey fields available
const PasskeyDTOSchema = z.object({
  id: objectIdSchema, 
  nickname: z.string(),
  createdAt: z.coerce.date(),
  lastUsed: z.coerce.date(),
});

// infer a typescript type from the zod schema
export type PasskeyDTO = z.infer<typeof PasskeyDTOSchema>;

// define a minimal interface for the raw passkey
interface RawPasskey {
  _id: ObjectId;
  nickname: string;
  createdAt: Date;
  lastUsed: Date;
}

function toPasskeyDTOInput(passkey: RawPasskey) {
  return {
    id: passkey._id,
    nickname: passkey.nickname,
    createdAt: new Date(passkey.createdAt),
    lastUsed: new Date(passkey.lastUsed),
  };
}

// sanitize a raw passkey object from the database
export function sanitizePasskey(passkey: RawPasskey): PasskeyDTO {
  return PasskeyDTOSchema.parse(toPasskeyDTOInput(passkey));
}

// array variant for multiple passkeys
export function sanitizePasskeys(passkeys: RawPasskey[]): PasskeyDTO[] {
  return passkeys.flatMap((passkey) => {
    const parsed = PasskeyDTOSchema.safeParse(toPasskeyDTOInput(passkey));
    return parsed.success ? [parsed.data] : [];
  });
}