import express from 'express';
import { Match } from '../models/Match.js';
import { Item } from '../models/Item.js';
import { OtpSession } from '../models/OtpSession.js';
import { authRequired } from '../middleware/auth.js';
import { generateMatchId } from '../utils/ids.js';
import { createHashedOtp, verifyOtp } from '../utils/otp.js';
import { otpLimiter } from '../middleware/otpRateLimit.js';
import * as trackingService from '../services/trackingService.js';
import * as otpService from '../services/otpService.js';
import * as meetupService from '../services/meetupService.js';

const router = express.Router();

router.post('/', authRequired, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Infer roles: for a found item, viewer is owner; for lost item, viewer is finder
    const owner = item.type.toLowerCase() === 'found' ? req.user._id : item.postedBy;
    const finder = item.type.toLowerCase() === 'found' ? item.postedBy : req.user._id;

    // Ensure we have valid coordinates for meetLocation
    const itemLat = item.location?.coordinates?.[1];
    const itemLng = item.location?.coordinates?.[0];

    const match = await Match.create({
      matchId: generateMatchId(),
      item: item._id,
      owner,
      finder,
      status: 'REQUESTED',
      meetLocation: {
        label: 'Spot B5',
        lat: (itemLat && !isNaN(itemLat)) ? itemLat : 20.2961,
        lng: (itemLng && !isNaN(itemLng)) ? itemLng : 85.8245,
      },
      meetWindow: {
        start: new Date(Date.now() + 30 * 60 * 1000),
        end: new Date(Date.now() + 90 * 60 * 1000),
      },
    });

    return res.status(201).json({ match });
  } catch (err) {
    console.error('Failed to create match:', err);
    console.error('Error details:', err.message);
    console.error('Item ID:', req.body.itemId);
    if (err.errors) {
      console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    }
    return res.status(500).json({ message: 'Failed to create match', error: err.message });
  }
});

router.get('/my', authRequired, async (req, res) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      $or: [{ owner: userId }, { finder: userId }],
    })
      .populate('item')
      .sort({ createdAt: -1 });
    return res.json({ matches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch matches' });
  }
});

// Get active meetups
router.get('/active', authRequired, async (req, res) => {
  try {
    const meetups = await meetupService.getActiveMeetups(req.user._id.toString());
    return res.json({ meetups });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch active meetups' });
  }
});

router.get('/:matchId', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId }).populate('item owner finder');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // STRICT DATA ISOLATION: Ensure requestor is part of the match
    const userId = req.user._id.toString();
    const ownerId = match.owner._id.toString();
    const finderId = match.finder._id.toString();

    if (userId !== ownerId && userId !== finderId) {
      return res.status(403).json({ message: 'Unauthorized: You are not part of this match' });
    }

    return res.json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch match' });
  }
});

// Location change endpoints
router.post('/:matchId/location/change', authRequired, async (req, res) => {
  try {
    const { location } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await meetupService.requestLocationChange(
      match._id,
      req.user._id.toString(),
      location
    );
    return res.json({ meetLocation: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to request location change' });
  }
});

router.post('/:matchId/location/approve/:requestIndex', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await meetupService.approveLocationChange(
      match._id,
      req.user._id.toString(),
      parseInt(req.params.requestIndex)
    );
    return res.json({ meetLocation: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to approve location change' });
  }
});

router.post('/:matchId/location/reject/:requestIndex', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await meetupService.rejectLocationChange(
      match._id,
      req.user._id.toString(),
      parseInt(req.params.requestIndex)
    );
    return res.json({ meetLocation: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to reject location change' });
  }
});

// Tracking endpoints
router.post('/:matchId/tracking/start', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const session = await trackingService.startTracking(match._id, req.user._id.toString());
    return res.json({ session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to start tracking' });
  }
});

router.post('/:matchId/tracking/update', authRequired, async (req, res) => {
  try {
    const { location } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await trackingService.updateLocation(
      match._id,
      req.user._id.toString(),
      location
    );
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to update location' });
  }
});

router.get('/:matchId/tracking/status', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const status = await trackingService.getTrackingStatus(match._id, req.user._id.toString());
    return res.json(status);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to get tracking status' });
  }
});

router.post('/:matchId/tracking/stop', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await trackingService.stopTracking(match._id, req.user._id.toString());
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to stop tracking' });
  }
});

// Enhanced OTP endpoints
router.post('/:matchId/otp/generate', authRequired, otpLimiter, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await otpService.generateOTPPair(match._id, req.user._id.toString());
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to generate OTPs' });
  }
});

router.post('/:matchId/otp/verify', authRequired, otpLimiter, async (req, res) => {
  try {
    const { otp } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = await otpService.verifyCrossOTP(match._id, req.user._id.toString(), otp);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || 'Failed to verify OTP' });
  }
});

router.get('/:matchId/otp/status', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const status = await otpService.getOTPStatus(match._id, req.user._id.toString());
    return res.json(status);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to get OTP status' });
  }
});

// Legacy OTP endpoints (keeping for backward compatibility)
router.post('/:matchId/send-otp', authRequired, otpLimiter, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { code: ownerCode, otpHash: ownerHash } = await createHashedOtp();
    const { code: finderCode, otpHash: finderHash } = await createHashedOtp();

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await OtpSession.create({ user: match.owner, match: match._id, purpose: 'match-owner', otpHash: ownerHash, expiresAt });
    await OtpSession.create({ user: match.finder, match: match._id, purpose: 'match-finder', otpHash: finderHash, expiresAt });

    match.status = 'OTP_SENT';
    await match.save();

    return res.json({
      message: 'OTP generated',
      ownerOtpDev: ownerCode,
      finderOtpDev: finderCode,
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
});

router.post('/:matchId/verify-owner', authRequired, otpLimiter, async (req, res) => {
  try {
    const { otp } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const session = await OtpSession.findOne({
      match: match._id,
      user: match.owner,
      purpose: 'match-owner',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!session) return res.status(400).json({ message: 'OTP not found' });
    if (session.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const ok = await verifyOtp(otp, session.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP' });

    session.consumed = true;
    await session.save();

    match.ownerVerified = true;
    if (match.ownerVerified && match.finderVerified) {
      match.status = 'VERIFIED';
    }
    await match.save();

    return res.json({ message: 'Owner verified', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to verify owner OTP' });
  }
});

router.post('/:matchId/verify-finder', authRequired, otpLimiter, async (req, res) => {
  try {
    const { otp } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const session = await OtpSession.findOne({
      match: match._id,
      user: match.finder,
      purpose: 'match-finder',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!session) return res.status(400).json({ message: 'OTP not found' });
    if (session.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const ok = await verifyOtp(otp, session.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP' });

    session.consumed = true;
    await session.save();

    match.finderVerified = true;
    if (match.ownerVerified && match.finderVerified) {
      match.status = 'VERIFIED';
    }
    await match.save();

    return res.json({ message: 'Finder verified', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to verify finder OTP' });
  }
});

router.post('/:matchId/recovered', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId }).populate('item');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'VERIFIED') {
      return res.status(400).json({ message: 'Match not verified yet' });
    }

    // Mark match as recovered
    match.status = 'RECOVERED';
    await match.save();

    // Mark the item as recovered so it doesn't appear on the map anymore
    if (match.item) {
      await Item.findByIdAndUpdate(match.item._id, { status: 'RECOVERED' });
    }

    return res.json({ message: 'Marked as recovered', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to mark as recovered' });
  }
});

export default router;

