export default interface User {
  _id: number;
  username: string;
  email: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  __v?: number;
}