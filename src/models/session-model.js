import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: uuidv4,
    required: [true, "Please provide a session id"],
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Please provide a user id"],
  },
  refreshToken: { // String storing SHA-256 hash of the actual token
    type: String,
    required: [true, "Please provide a refresh token SHA-256 hash"],
    index: true,
  },
  userAgent: String, // String for browser/device identification, optional
  ipAddress: String, // String for client IP, optional
  expiresAt: { // Date for session expiration, required, indexed (for cleanup queries)
    type: Date,
    expires: 0,
    required: [true, "Please provide an expiration date"],
  },
  lastActive: { // Date for activity tracking, required
    type: Date,
    required: [true, "Please provide a last active date"],
  },
});

sessionSchema.index({ userId: 1, expiresAt: 1 });

const Session = mongoose.models.sessions || mongoose.model("sessions", sessionSchema);

export default Session;