import mongoose, { Schema } from "mongoose";

const passkeySchema = new mongoose.Schema({
  // base64url-encoded credential identifier
  credentialId: {
    type: String,
    unique: true,
    index: true,
    required: [true, "Please provide a credential id"],
  },
  // owner of the passkey
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Please provide a user id"],
  },
  // base64url-encoded public key
  publicKey: {
    type: Buffer,
    required: [true, "Please provide a public key"],
  },
  // signature counter for clone detection
  counter: {
    type: Number,
  },
  // supported transports (ble, cable, hybrid, internal, nfc, smart-card, usb)
  transports: {
    type: [String],
    enum: ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'],
    default: [],
  },
  // user-editable display name, default to device/platform info
  nickname: {
    type: String,
  },
  // registration timestamp
  createdAt: {
    type: Date,
  },
  // last successful authentication
  lastUsed: {
    type: Date,
    default: null
  },
  // credential device type from registration info
  deviceType: {
    type: String,
  },
  // whether credential is backed up (e.g., iCloud Keychain)
  backedUp: {
    type: Boolean,
    default: false,
  }
});

// Add compound index on (userId, credentialId) for efficient lookups
passkeySchema.index({ userId: 1, credentialId: 1 });

const Passkey = mongoose.models.passkeys || mongoose.model("passkeys", passkeySchema);

export default Passkey;