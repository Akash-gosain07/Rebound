import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', authRequired, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.patch('/mark-all-read', authRequired, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
