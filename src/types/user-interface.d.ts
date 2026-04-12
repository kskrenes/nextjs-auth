export default interface NaeUser {
  _id: string;
  username: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  socialLinks?: string[];
  avatarId?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  __v?: number;
}