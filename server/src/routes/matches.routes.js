import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { Match } from '../models/Match.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { sendOtpToFinder } from '../services/otpService.js';
import { generateCertificatePdf } from '../services/certificateService.js';

const router = express.Router();

// Find a match involving the current user for a given item (lost or found)
router.get('/by-item/:itemId', authRequired, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const match = await Match.findOne({
      $and: [
        {
          $or: [{ lostItem: itemId }, { foundItem: itemId }]
        },
        {
          $or: [{ owner: userId }, { finder: userId }]
        }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('lostItem')
      .populate('foundItem')
      .populate('owner', 'userId name trustScore')
      .populate('finder', 'userId name trustScore');

    if (!match) {
      return res.json({ match: null });
    }

    res.json({ match });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostItem')
      .populate('foundItem')
      .populate('owner', 'userId name trustScore')
      .populate('finder', 'userId name trustScore');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json({ match });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/request-claim', authRequired, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('finder').populate('lostItem');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can claim' });
    }

    await sendOtpToFinder(match);
    match.status = 'OTP_SENT';
    await match.save();

    res.json({ message: 'OTP sent to finder', matchId: match._id });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/verify-otp', authRequired, async (req, res, next) => {
  try {
    const { otp } = req.body;
    const match = await Match.findById(req.params.id).populate('lostItem').populate('foundItem');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can verify OTP' });
    }

    if (!match.otpCode || !match.otpExpiresAt || match.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired or not set' });
    }

    if (match.otpCode !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    match.status = 'CONFIRMED';
    await match.save();

    await Item.findByIdAndUpdate(match.lostItem._id, { status: 'RECOVERED' });

    const owner = await User.findById(match.owner);
    const finder = await User.findById(match.finder);
    if (owner) {
      owner.stats.recovered += 1;
      owner.trustScore = Math.min(5, owner.trustScore + 0.5);
      await owner.save();
    }
    if (finder) {
      finder.stats.matchesFound += 1;
      finder.trustScore = Math.min(5, finder.trustScore + 0.5);
      await finder.save();
    }

    const certificateUrl = `/api/matches/${match._id}/certificate`;

    res.json({ message: 'Match confirmed', certificateUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/certificate', authRequired, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostItem')
      .populate('foundItem')
      .populate('owner', 'name userId')
      .populate('finder', 'name userId');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="rebound-recovery-certificate.pdf"');

    const doc = await generateCertificatePdf(match);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;
