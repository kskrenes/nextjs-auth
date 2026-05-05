import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Please provide a user id"],
  },
  action: { 
    type: String, 
    enum: ['login', 'password_reset', 'password_created', 'email_verified', 'profile_updated', 'google_account_linked'], 
    required: [true, "Please provide an action type"], 
  },
  ipAddress: String, // String for client IP, optional
  userAgent: String, // String for browser/device identification, optional
  metadata: Schema.Types.Mixed, // Flexible field for additional info
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '90d', // Automatically delete logs after 90 days
    index: true, // Index for efficient querying by date
  },
});

securityLogSchema.index({ userId: 1, createdAt: 1 });

const SecurityLog = mongoose.models.securityLogs || mongoose.model("securityLogs", securityLogSchema);

export default SecurityLog;