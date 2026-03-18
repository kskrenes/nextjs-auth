export default interface NaeUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  __v?: number;
}