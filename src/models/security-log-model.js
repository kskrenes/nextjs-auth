
import { securityEvents } from "@/helpers/util/security-event-utils";
import mongoose, { Schema } from "mongoose";

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Please provide a user id"],
  },
  action: { 
    type: String, 
    enum: securityEvents,
    required: [true, "Please provide an action type"], 
  },
  ipAddress: {
    type: String,
    trim: true,
    maxLength: [64, "IP address must be at most 64 characters long"],
  }, // optional, bounded
  userAgent: {
    type: String,
    trim: true,
    maxLength: [512, "User agent string must be at most 512 characters long"],
  }, // optional, bounded
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