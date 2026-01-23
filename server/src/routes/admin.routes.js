import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { Item } from '../models/Item.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Get all unverified items
router.get('/unverified-items', authRequired, requireAdmin, async (req, res, next) => {
  try {
    const items = await Item.find({ verified: false }).sort({ createdAt: -1 }).populate('postedBy', 'userId name');
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// Mark item as verified
router.patch('/items/:id/verify', authRequired, requireAdmin, async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).populate(
      'postedBy',
      'userId name'
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

export default router;
