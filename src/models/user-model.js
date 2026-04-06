import mongoose from "mongoose";

export const defaultAvatarId = "default_potato";

const urlValidator = {
  validator: function(v) {
    if (v === "") return true;
    try {
      new URL(v);
      return true;
    } catch (e) {
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
    required: [true, "Please provide a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    match: [/^\S*$/, 'Please provide a password without spaces'],
    select: false, // exclude password from query results by default
  },
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
});

const User = mongoose.models.users || mongoose.model("users", userSchema);

export default User;