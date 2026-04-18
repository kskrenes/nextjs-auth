export default interface NaeUser {
  _id: string;
  username: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  socialLinks?: string[];
  avatarId?: string;
  hasCompletedProfile?: boolean;
  isVerified?: boolean;
  isAdmin?: boolean;
  linkedProviders?: string[];
  __v?: number;
}