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
    const owner = item.type.toLowerCase() === 'found' ? req.user._id : item.reportedBy;
    const finder = item.type.toLowerCase() === 'found' ? item.reportedBy : req.user._id;

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
      statusHistory: [{
        status: 'REQUESTED',
        changedBy: req.user._id,
        note: 'Match created'
      }]
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

    const myRole = userId === ownerId ? 'OWNER' : 'FINDER';

    return res.json({ match, myRole });
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
    match.statusHistory.push({
      status: match.status,
      changedBy: req.user._id,
      note: 'Owner verified via OTP'
    });
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
    match.statusHistory.push({
      status: match.status,
      changedBy: req.user._id,
      note: 'Finder verified via OTP'
    });
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
    match.statusHistory.push({
      status: 'RECOVERED',
      changedBy: req.user._id,
      note: 'Item marked as recovered'
    });
    await match.save();

    // Mark the item as recovered so it doesn't appear on the map anymore
    if (match.item) {
      await Item.findByIdAndUpdate(match.item._id, {
        status: 'CLAIMED', // Use CLAIMED to indicate it's been taken
        claimedBy: match.finder // Assign ownership to finder (or whoever claimed it)
      });
    }

    return res.json({ message: 'Marked as recovered', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to mark as recovered' });
  }
});

// --- Safe Meetup & Help Desk Endpoints ---

// 1. Suggest Safe Locations (Midpoint)
router.post('/:matchId/location/suggest', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId }).populate('item');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // For now, use Item location as one anchor.
    // In a real app, we'd take the user's current location from the request body or last known location.
    const itemLat = match.item?.location?.coordinates?.[1] || 20.2961;
    const itemLng = match.item?.location?.coordinates?.[0] || 85.8245;

    // --- CONTEXT AWARE LOGIC ---
    // Define Campus Center (approximate)
    const CAMPUS_CENTER = { lat: 20.2961, lng: 85.8245 };
    const CAMPUS_RADIUS_KM = 2.0;

    // Helper to calculate distance (Haversine formula)
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2 - lat1);
      var dLon = deg2rad(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
      return d;
    }

    const deg2rad = (deg) => {
      return deg * (Math.PI / 180)
    }

    const distFromCampus = getDistanceFromLatLonInKm(itemLat, itemLng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
    let safeLocations = [];

    if (distFromCampus <= CAMPUS_RADIUS_KM) {
      // CAMPUS CONTEXT: Suggest University specific spots
      safeLocations = [
        {
          label: 'Library Help Desk',
          lat: CAMPUS_CENTER.lat - 0.001,
          lng: CAMPUS_CENTER.lng - 0.001,
          address: 'Central Library, Ground Floor',
          type: 'SAFE_POINT'
        },
        {
          label: 'Hostel Security',
          lat: CAMPUS_CENTER.lat + 0.003,
          lng: CAMPUS_CENTER.lng - 0.002,
          address: 'Main Boys Hostel Gate',
          type: 'SAFE_POINT'
        },
        {
          label: 'Gate Security',
          lat: CAMPUS_CENTER.lat + 0.002,
          lng: CAMPUS_CENTER.lng + 0.002,
          address: 'University Main Entrance',
          type: 'SAFE_POINT'
        },
        {
          label: 'College Help Desk',
          lat: CAMPUS_CENTER.lat,
          lng: CAMPUS_CENTER.lng + 0.001,
          address: 'Admin Block Reception',
          type: 'SAFE_POINT'
        }
      ];
    } else {
      // CITY CONTEXT: Suggest generic safe spots near the item
      safeLocations = [
        {
          label: 'Nearest Police Station',
          lat: itemLat + 0.005,
          lng: itemLng + 0.005,
          address: 'City Police Dept',
          type: 'SAFE_POINT'
        },
        {
          label: 'City Center Traffic Post',
          lat: itemLat - 0.004,
          lng: itemLng + 0.002,
          address: 'Main Traffic Junction',
          type: 'SAFE_POINT'
        },
        {
          label: 'Community Security Desk',
          lat: itemLat + 0.002,
          lng: itemLng - 0.003,
          address: 'Local Community Center',
          type: 'SAFE_POINT'
        }
      ];
    }

    return res.json({ safeLocations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch safe locations' });
  }
});

// 2. Select Location (Finder selects)
router.post('/:matchId/location/select', authRequired, async (req, res) => {
  try {
    const { location } = req.body; // { label, lat, lng, address }
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Update meetLocation
    match.meetLocation = {
      ...match.meetLocation,
      label: location.label,
      lat: location.lat,
      lng: location.lng,
      type: 'SAFE_POINT',
      suggestedBy: req.user._id,
      isLocked: false // Pending owner confirmation
    };

    // Reset approvals
    match.meetLocation.approvedBy = [req.user._id];

    await match.save();
    return res.json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to select location' });
  }
});

// 3. Confirm/Lock Location (Owner confirms)
router.post('/:matchId/location/lock', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can confirm the final location' });
    }

    match.meetLocation.isLocked = true;
    if (!match.meetLocation.approvedBy.includes(req.user._id)) {
      match.meetLocation.approvedBy.push(req.user._id);
    }

    await match.save();
    return res.json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to lock location' });
  }
});

// 4. Hand Over to Help Desk (Finder action)
router.post('/:matchId/handover/help-desk', authRequired, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.finder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the finder can hand over to Help Desk' });
    }

    const { location } = req.body;

    match.status = 'HELD_AT_HELP_DESK';
    match.handoverType = 'HELP_DESK';
    match.verificationAuthority = 'HELP_DESK';
    match.statusHistory.push({
      status: 'HELD_AT_HELP_DESK',
      changedBy: req.user._id,
      note: 'Finder handed over item to Help Desk'
    });

    // Record handover details
    match.helpDesk = {
      handedOverAt: new Date(),
      location: {
        label: location?.label || 'Help Desk', // Fallback if simple string
        lat: location?.lat || match.meetLocation.lat,
        lng: location?.lng || match.meetLocation.lng,
        address: location?.address
      },
      verifiedByHelpDesk: false
    };

    // Update Item status too
    if (match.item) {
      await Item.findByIdAndUpdate(match.item, { status: 'HELD_AT_HELP_DESK' });
    }

    // Generate a fresh OTP for the Owner to use at the Help Desk
    // We store this in the Owner's OTP slot for simplicity, but conceptually it's "System -> Owner"
    const { code, otpHash } = await createHashedOtp();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Invalidate old sessions
    await OtpSession.updateMany(
      { match: match._id, consumed: false },
      { consumed: true }
    );

    // Create new session for Help Desk Verification
    await OtpSession.create({
      user: match.owner,
      match: match._id,
      purpose: 'help-desk-verification',
      otpHash,
      expiresAt
    });

    // Store in match for easy reference/debugging (hashed in session, plain here for demo response if needed, 
    // but better to just say "OTP Generated")
    // Note: In real production, don't send OTP in response like this unless it's to the person entering it? 
    // Here, the OWNER needs the OTP to give to the HELPDESK.
    // Since this is the FINDER calling, we DO NOT return the OTP. 
    // The Owner will request it or it will be emailed/notified.

    await match.save();

    return res.json({ message: 'Item handed over to Help Desk', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to hand over to help desk' });
  }
});

// 5. Verify at Help Desk (Owner enters OTP that was sent to them/generated for them)
// In this flow: "Owner must: Enter OTP sent to the help desk system account" 
// Implementation: Owner calls this endpoint with the OTP they "received" from the "system".
// OR: Help Desk Official enters the code the Owner gives them.
// Let's assume: Owner is at the Kiosk, logs in, enters the code they received via Request.
router.post('/:matchId/verify/help-desk-claim', authRequired, otpLimiter, async (req, res) => {
  try {
    const { otp } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId }).populate('item');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.status !== 'HELD_AT_HELP_DESK') {
      return res.status(400).json({ message: 'Item is not at Help Desk' });
    }

    // Verify against the 'help-desk-verification' session
    const session = await OtpSession.findOne({
      match: match._id,
      user: match.owner,
      purpose: 'help-desk-verification',
      consumed: false
    }).sort({ createdAt: -1 });

    if (!session) return res.status(400).json({ message: 'Valid OTP not found. Please request a new code.' });
    if (session.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const ok = await verifyOtp(otp, session.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP' });

    session.consumed = true;
    await session.save();

    // Success
    match.status = 'RECOVERED';
    match.helpDesk.verifiedByHelpDesk = true;
    match.completedAt = new Date();
    match.statusHistory.push({
      status: 'RECOVERED',
      changedBy: req.user._id,
      note: 'Help Desk verification complete'
    });
    await match.save();

    if (match.item) {
      // In help desk flow, the 'owner' (original reporter of found item, or loser of lost item) retrieves it.
      // Logic: If 'found' item -> Owner retrieves -> claimedBy = Owner.
      // If 'lost' item -> Finder hands over -> Owner retrieves -> claimedBy = Owner.
      await Item.findByIdAndUpdate(match.item._id, {
        status: 'CLAIMED',
        claimedBy: match.owner
      });
    }

    return res.json({ message: 'Item recovered successfully from Help Desk', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to verify Help Desk claim' });
  }
});

// Helper for Owner to get their Help Desk OTP (since we don't have SMS/Email in this demo env really working UI-side often)
router.post('/:matchId/otp/help-desk/generate', authRequired, otpLimiter, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    // Only owner
    if (match.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { code, otpHash } = await createHashedOtp();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await OtpSession.create({
      user: match.owner,
      match: match._id,
      purpose: 'help-desk-verification',
      otpHash,
      expiresAt
    });

    return res.json({ ownerOTP: code });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate OTP' });
  }
});

export default router;

