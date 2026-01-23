import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authRequired } from '../middleware/auth.js';
import { generateUserId } from '../services/idService.js';

const router = express.Router();

function signTokens(user) {
  const payload = { sub: user._id.toString(), userId: user.userId, email: user.email, isAdmin: user.isAdmin };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const tokens = signTokens(user);
    res.json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: generateUserId(),
      name,
      email,
      passwordHash,
      trustScore: 0,
      isVerified: false
    });

    const tokens = signTokens(user);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/guest', async (req, res, next) => {
  try {
    const random = Math.floor(Math.random() * 10000);
    const email = `guest-${random}@rebound.app`;
    const passwordHash = await bcrypt.hash('guest-password', 10);

    const user = await User.create({
      userId: generateUserId(),
      name: 'Guest User',
      email,
      passwordHash,
      trustScore: 0
    });

    const tokens = signTokens(user);
    res.json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh');
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const tokens = signTokens(user);
    res.json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
