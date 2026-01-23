import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    phone: { type: String },
    authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const User = mongoose.model('User', userSchema);
