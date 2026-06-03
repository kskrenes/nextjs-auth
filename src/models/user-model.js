import { defaultAvatarId } from "@/helpers/util/avatar-utils";
import mongoose from "mongoose";

const urlValidator = {
  validator: function(v) {
    if (v === "") return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },
  message: props => `${props.value} is not a valid URL`
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    minlength: [4, "Username must be at least 4 characters long"],
    match: [/^\S*$/, 'Please provide a username without spaces'],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    minlength: [8, "Password must be at least 8 characters long"],
    match: [/^\S*$/, 'Please provide a password without spaces'],
    select: false, // exclude password from query results by default
  },
  accounts: [{
    provider: { type: String, enum: ['google', 'credentials'], required: true },
    providerId: { type: String, required: true }, // This is where the 'sub' goes
  }],
  name: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    validate: urlValidator,
  },
  socialLinks: [{
    type: String,
    trim: true,
    validate: urlValidator,
  }],
  avatarId: {
    type: String,
    trim: true,
    default: defaultAvatarId,
  },
  hasCompletedProfile: {
    type: Boolean,
    default: false,
  },
  hasStrongPassword: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
  verifyToken: String,
  verifyTokenExpiry: Date,
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: {
    type: String,
    select: false, // exclude mfaSecret from query results by default
  },
  mfaBackupCodes: {
    type: [String],
    select: false, // exclude mfaBackupCodes from query results by default
  },
});

userSchema.index({ "accounts.provider": 1, "accounts.providerId": 1 }, { unique: true });

const User = mongoose.models.users || mongoose.model("users", userSchema);

export default User;