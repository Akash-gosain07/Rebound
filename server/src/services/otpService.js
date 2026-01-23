import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { Match } from '../models/Match.js';
import { emitToUser, emitToMatch } from '../config/socket.js';

function createTransport() {
  if (!process.env.SMTP_HOST) {
    return null; // fallback to console logging
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpToFinder(match) {
  const otp = generateOtp();
  match.otpCode = otp;
  match.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await match.save();

  const transport = createTransport();
  const to = match.finder.email || 'demo@example.com';

  const message = {
    from: 'rebound@demo.app',
    to,
    subject: 'Your Rebound verification code',
    text: `Your Rebound OTP is ${otp}. Share it only after you have verified ownership of the item.`
  };

  if (transport) {
    await transport.sendMail(message);
  } else {
    console.log('OTP for finder', to, '=>', otp);
  }
}

// New enhanced OTP functions for dual OTP system

// New enhanced OTP functions for one-way OTP system (Owner generates, Finder verifies)

// Generate OTP for Owner ONLY
export const generateOTPPair = async (matchId, userId) => {
  const match = await Match.findById(matchId).populate('owner finder');

  if (!match) {
    throw new Error('Match not found');
  }

  // Only the OWNER can generate the code
  if (match.owner._id.toString() !== userId) {
    throw new Error('Only the owner can generate the verification code');
  }

  // Generate ONE unique OTP
  const ownerOTPCode = generateOtp();

  // Hash OTP
  const ownerOTPHash = await bcrypt.hash(ownerOTPCode, 10);

  // Set expiration (30 minutes from now)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Update match
  match.ownerOTP = {
    code: ownerOTPHash,
    generated: true,
    expiresAt,
  };
  // finderOTP is not used in this flow, explicitly clear it to avoid confusion
  match.finderOTP = {
    code: null,
    generated: false,
    expiresAt: null
  };

  match.status = 'OTP_SENT';
  await match.save();

  // Emit OTP to OWNER
  emitToUser(match.owner._id.toString(), 'otp:generated', {
    matchId: matchId.toString(),
    yourOTP: ownerOTPCode,
    expiresAt,
  });

  return {
    message: 'Verification code generated',
    expiresAt,
    ownerOTP: ownerOTPCode
  };
};

// Verify OTP (Finder verifies Owner's OTP)
export const verifyCrossOTP = async (matchId, userId, enteredOTP) => {
  const match = await Match.findById(matchId).populate('owner finder item');

  if (!match) {
    throw new Error('Match not found');
  }

  const isFinder = match.finder._id.toString() === userId;

  if (!isFinder) {
    throw new Error('Only the finder can verify the verification code');
  }

  // Check if OTP is generated
  if (!match.ownerOTP?.generated) {
    throw new Error('Verification code not generated yet');
  }

  // Check expiration
  const now = new Date();
  if (now > match.ownerOTP.expiresAt) {
    throw new Error('Verification code has expired');
  }

  // Verify entered code against owner's OTP hash
  const isValid = await bcrypt.compare(enteredOTP, match.ownerOTP.code);

  if (!isValid) {
    throw new Error('Invalid verification code');
  }

  // Mark match as verified
  match.ownerVerified = true;
  match.finderVerified = true;
  match.status = 'VERIFIED';
  match.meetupCompleted = true;
  match.completedAt = new Date();

  // Update item status to RECOVERED
  const Item = (await import('../models/Item.js')).Item;
  await Item.findByIdAndUpdate(match.item._id, { status: 'RECOVERED' });

  // Emit completion to both users
  emitToMatch(matchId.toString(), 'match:completed', {
    matchId: matchId.toString(),
    message: 'Item successfully returned! 🎉',
    completedAt: match.completedAt,
  });

  await match.save();

  return {
    verified: true,
    bothVerified: true,
    meetupCompleted: true,
  };
};

// Get OTP status
export const getOTPStatus = async (matchId, userId) => {
  const match = await Match.findById(matchId);

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.owner.toString() !== userId && match.finder.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  return {
    generated: match.ownerOTP?.generated,
    expiresAt: match.ownerOTP?.expiresAt,
    ownerVerified: match.ownerVerified,
    finderVerified: match.finderVerified,
    bothVerified: match.ownerVerified && match.finderVerified,
    meetupCompleted: match.meetupCompleted,
  };
};

