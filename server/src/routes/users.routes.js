import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

// Get current user (similar to /auth/me but under /users)
router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

// (Optional) list own items or other user-centric endpoints can go here later.

export default router;
