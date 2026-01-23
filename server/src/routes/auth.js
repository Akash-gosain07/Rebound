import express from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { OtpSession } from '../models/OtpSession.js';
import { generateUserId } from '../utils/ids.js';
import { createHashedOtp, verifyOtp } from '../utils/otp.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { otpLimiter } from '../middleware/otpRateLimit.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      userId: generateUserId(),
      fullName,
      email,
      passwordHash,
      phone,
      authProvider: 'email',
      isVerified: false,
    });

    const { code, otpHash } = await createHashedOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpSession.create({
      user: user._id,
      purpose: 'signup',
      otpHash,
      expiresAt,
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
      },
      devOtp: code,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Google OAuth login � in development you can send idToken="dev" to skip real Google verification.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Missing idToken' });

    let email;
    let fullName;

    if (process.env.NODE_ENV !== 'production' && idToken === 'dev') {
      // Dev-only shortcut to avoid configuring Google while keeping the flow real.
      email = 'dev-google@rebound.test';
      fullName = 'Rebound Google Dev';
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      fullName = payload.name || 'Google User';
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        userId: generateUserId(),
        fullName,
        email,
        authProvider: 'google',
        isVerified: false,
      });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Google login failed' });
  }
});

// Optional GET variant to align with the API spec (expects idToken as query param)
router.get('/google', async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(400).json({ message: 'Missing idToken' });

    let email;
    let fullName;

    if (process.env.NODE_ENV !== 'production' && idToken === 'dev') {
      email = 'dev-google@rebound.test';
      fullName = 'Rebound Google Dev';
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      fullName = payload.name || 'Google User';
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        userId: generateUserId(),
        fullName,
        email,
        authProvider: 'google',
        isVerified: false,
      });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Google login failed' });
  }
});


// Guest login � creates a temporary guest user
router.post('/guest', async (req, res) => {
    try {
        const random = Math.floor(Math.random() * 100000);
        const email = `guest-${random}@rebound.app`;
        const passwordHash = await bcrypt.hash('guest-password', 10);

        const user = await User.create({
            userId: generateUserId(),
            fullName: 'Guest User',
            email,
            passwordHash,
            authProvider: 'guest',
            isVerified: false,
        });

        const token = signToken(user);
        return res.json({
            token,
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to create guest session' });
    }
});

router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const session = await OtpSession.findOne({
      user: user._id,
      purpose: 'signup',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!session) return res.status(400).json({ message: 'OTP not found' });
    if (session.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const ok = await verifyOtp(otp, session.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP' });

    session.consumed = true;
    await session.save();
    user.isVerified = true;
    await user.save();

    return res.json({ message: 'Phone verified', isVerified: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = req.user;
  return res.json({
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
});

export default router;
