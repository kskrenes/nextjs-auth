import { KeyRound, Link2, LogIn, Mail, User } from "lucide-react";

export const securityEventConfig = {
  login: {
    icon: LogIn,
    label: 'Sign In',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  password_reset: {
    icon: KeyRound,
    label: 'Password Changed',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  password_created: {
    icon: KeyRound,
    label: 'Password Created',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  email_verified: {
    icon: Mail,
    label: 'Email Verified',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  profile_updated: {
    icon: User,
    label: 'Profile Updated',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
  },
  google_account_linked: {
    icon: Link2,
    label: 'Google Account Linked',
    color: 'text-pink-600',
    bg: 'bg-pink-100',
  },
} as const;

export type SecurityEventType = keyof typeof securityEventConfig;
export const securityEvents = Object.keys(securityEventConfig) as SecurityEventType[];