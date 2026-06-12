import { z } from "zod";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';

const EMAIL_TYPES = ["VERIFY", "RESET"] as const;

const requiredString = (message: string) => 
  z.string({ error: message }).trim().min(1, { error: message });

const userPassSchema = (fieldName: string) => {
  const lowerCaseField = fieldName.toLowerCase();
  const capitalizedField = fieldName.replace(/^./, char => char.toUpperCase());
  return z.string({
    error: (issue) => {
      // If input is strictly undefined, it's a "required" error
      if (issue.input === undefined) {
          return `Invalid ${lowerCaseField}`;
      }
      // Otherwise, it exists but is the wrong type (e.g., number, boolean)
      return "Invalid request payload";
    },
  })
  .min(1, `Invalid ${lowerCaseField}`)
  .min(8, `${capitalizedField} must meet minimum character requirement`)
  .refine((val) => !val.includes(" "), {
    message: `${capitalizedField} cannot contain spaces`,
  });
}

export const passwordSchema = userPassSchema("password");
export const usernameSchema = z.preprocess((val) => {
  if (typeof val === "string") return val.trim();
  return val;
}, userPassSchema("username"));

export const LoginSchema = z.object({
  email: z.email("Invalid email or password"),
  password: passwordSchema
});

export const GoogleTokenSchema = z.object({
  token: requiredString("Invalid token")
});

export const MFACodeSchema = z.object({
  code: z.string({error: "Invalid request"}).refine(
    (val) => val.length === 6 || val.length === 8, 
    { message: "Code must be 6 or 8 characters" }
  )
});

export const EmailTypeSchema = z.object({
  email: z.email(),
  type: z.enum(EMAIL_TYPES)
});

export const EmailType = {
  VERIFY: "VERIFY",
  RESET: "RESET",
} as const;

export type EmailType = z.infer<typeof EmailTypeSchema>["type"];

export const SessionParamsSchema = z.object({
  sessionId: requiredString("Invalid session ID")
});

export const ParamsToSignSchema = z.object({
  paramsToSign: z.record(z.string(), z.unknown(), {
    error: "Invalid paramsToSign", // Catches missing, null, array, or non-object inputs
  }),
});

export const LinkCredentialsSchema = z.object({
  password: passwordSchema
});

export const ResetPasswordSchema = z.object({
  token: requiredString("Invalid token, please follow the link from your email"),
  password: passwordSchema
});

export const SignUpSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email({error: "Invalid email"})),
  password: passwordSchema
});

export const UpdateUserSchema = z.object({
  username: z.string({ error: "Invalid user fields" }).trim(),
  name: z.string({ error: "Invalid user fields" }).trim(),
  company: z.string({ error: "Invalid user fields" }).trim(),
  website: z.string({ error: "Invalid user fields" }).trim(),
  avatarId: z.string({ error: "Invalid user fields" }).trim(),
  socialLinks: z.array(
    z.string({ error: "Invalid user fields" }).trim(), {
    error: "Invalid user fields",
  }),
}, {
  error: "Invalid request payload" // Catches null, arrays, numbers, or missing bodies
})
.partial() // Makes every single field optional (allows them to be undefined)
.refine(
  (data) => Object.keys(data).length > 0, 
  { error: "No updatable fields provided" }
)
// Transform the validated input into the final Mongoose update object
.transform((data) => {
  // Define the base output type structure
  const result: typeof data & { hasCompletedProfile?: true } = { ...data };

  if (data.username !== undefined && data.username.length > 0) {
    result.hasCompletedProfile = true;
  }

  // If username is missing, hasCompletedProfile is simply not added to the object keys
  return result;
});

export const VerifyEmailSchema = z.object({ 
  token: requiredString("Invalid token, please follow the link from your email")
});

// Define the exact WebAuthn transport string literals
const AuthenticatorTransportFutureSchema = z.union([
  z.literal('ble'),
  z.literal('cable'),
  z.literal('hybrid'),
  z.literal('internal'),
  z.literal('nfc'),
  z.literal('smart-card'),
  z.literal('usb'),
]);

// passkey registration-specific response
const AuthenticatorAttestationResponseSchema = z.object({
  clientDataJSON: z.string(),
  attestationObject: z.string(),
  transports: z.array(AuthenticatorTransportFutureSchema).optional(),
  publicKeyAlgorithm: z.number().optional(),
  publicKey: z.string().optional(),
});

// passkey authentication-specific response
const AuthenticatorAssertionResponseSchema = z.object({
  clientDataJSON: z.string(),
  authenticatorData: z.string(),
  signature: z.string(),
  userHandle: z.string().optional(),
  attestationObject: z.string().optional(), // Added optionally to match potential hybrid shapes
});

// Define the Registration schema to strictly map to RegistrationResponseJSON
export const RegistrationResponseJSONSchema: z.ZodType<RegistrationResponseJSON> = z.object({
  id: z.string(),
  rawId: z.string(),
  type: z.literal('public-key'),
  response: AuthenticatorAttestationResponseSchema,
  clientExtensionResults: z.record(z.string(), z.any()), 
  authenticatorAttachment: z.union([z.literal('platform'), z.literal('cross-platform')]).optional(),
});

// Define the Authentication schema to strictly map to AuthenticationResponseJSON
export const AuthenticationResponseJSONSchema: z.ZodType<AuthenticationResponseJSON> = z.object({
  id: z.string(),
  rawId: z.string(),
  type: z.literal('public-key'),
  response: AuthenticatorAssertionResponseSchema,
  clientExtensionResults: z.record(z.string(), z.any()),
  authenticatorAttachment: z.union([z.literal('platform'), z.literal('cross-platform')]).optional(),
});

export const PasskeyRegistrationVerificationSchema = z.object({
  registrationResponse: RegistrationResponseJSONSchema
});

export const PasskeyAuthenticationVerificationSchema = z.object({
  authenticationResponse: AuthenticationResponseJSONSchema
});

export const PasskeyParamsSchema = z.object({
  passkeyId: requiredString("Invalid passkey ID")
});

export const UpdatePasskeySchema = z.object({
  nickname: requiredString("Invalid passkey nickname")
});