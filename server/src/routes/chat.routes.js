import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { ChatMessage } from '../models/ChatMessage.js';

const router = express.Router();

router.get('/:matchId', authRequired, async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const messages = await ChatMessage.find({ match: matchId })
      .sort({ createdAt: 1 })
      .populate('sender', 'userId name');
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

export default router;
