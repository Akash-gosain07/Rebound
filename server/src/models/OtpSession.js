import mongoose from 'mongoose';

const otpSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    purpose: {
      type: String,
      enum: ['signup', 'match-owner', 'match-finder', 'help-desk-verification'],
      required: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OtpSession = mongoose.model('OtpSession', otpSessionSchema);
