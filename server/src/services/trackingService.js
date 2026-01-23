import { TrackingSession } from '../models/TrackingSession.js';
import { Match } from '../models/Match.js';
import { emitToMatch, emitToOtherUserInMatch } from '../config/socket.js';

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance; // in km
};

// Calculate ETA based on distance (assuming walking speed of 5 km/h)
export const calculateETA = (distanceKm) => {
    const walkingSpeedKmh = 5;
    const hours = distanceKm / walkingSpeedKmh;
    const minutes = Math.round(hours * 60);
    return minutes;
};

// Start tracking session
export const startTracking = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('owner finder item');

    if (!match) {
        throw new Error('Match not found');
    }

    // Check if user is part of the match
    if (match.owner._id.toString() !== userId && match.finder._id.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    // Check if tracking already active
    let session = await TrackingSession.findOne({ matchId, status: 'ACTIVE' });

    if (!session) {
        session = await TrackingSession.create({
            matchId,
            owner: match.owner._id,
            finder: match.finder._id,
            item: match.item._id,
            startedBy: userId,
            status: 'ACTIVE',
        });

        // Update match
        match.liveTrackingActive = true;
        await match.save();
    }

    // Emit to other user
    emitToOtherUserInMatch(matchId.toString(), userId, 'tracking:started', {
        matchId: matchId.toString(),
        startedBy: userId,
        session: session,
    });

    return session;
};

// Update user location
export const updateLocation = async (matchId, userId, location) => {
    const match = await Match.findById(matchId);

    if (!match) {
        throw new Error('Match not found');
    }

    const isOwner = match.owner.toString() === userId;
    const isFinder = match.finder.toString() === userId;

    if (!isOwner && !isFinder) {
        throw new Error('Unauthorized');
    }

    // Update match location
    if (isOwner) {
        match.ownerCurrentLocation = {
            lat: location.lat,
            lng: location.lng,
            lastUpdated: new Date(),
        };
    } else {
        match.finderCurrentLocation = {
            lat: location.lat,
            lng: location.lng,
            lastUpdated: new Date(),
        };
    }

    await match.save();

    // Update tracking session
    const session = await TrackingSession.findOne({ matchId, status: 'ACTIVE' });
    if (session) {
        if (isOwner) {
            session.ownerLocation = {
                lat: location.lat,
                lng: location.lng,
                lastUpdated: new Date(),
            };
        } else {
            session.finderLocation = {
                lat: location.lat,
                lng: location.lng,
                lastUpdated: new Date(),
            };
        }
        await session.save();
    }

    // Calculate distance and ETA if both locations available
    let distance = null;
    let eta = null;
    if (match.ownerCurrentLocation?.lat && match.finderCurrentLocation?.lat) {
        distance = calculateDistance(
            match.ownerCurrentLocation.lat,
            match.ownerCurrentLocation.lng,
            match.finderCurrentLocation.lat,
            match.finderCurrentLocation.lng
        );
        eta = calculateETA(distance);
    }

    // Emit to other user (handled by socket.js)
    return {
        location,
        distance,
        eta,
    };
};

// Get tracking status
export const getTrackingStatus = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('owner finder item');

    if (!match) {
        throw new Error('Match not found');
    }

    if (match.owner._id.toString() !== userId && match.finder._id.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    const session = await TrackingSession.findOne({ matchId, status: 'ACTIVE' });

    let distance = null;
    let eta = null;
    if (match.ownerCurrentLocation?.lat && match.finderCurrentLocation?.lat) {
        distance = calculateDistance(
            match.ownerCurrentLocation.lat,
            match.ownerCurrentLocation.lng,
            match.finderCurrentLocation.lat,
            match.finderCurrentLocation.lng
        );
        eta = calculateETA(distance);
    }

    return {
        active: match.liveTrackingActive,
        session,
        ownerLocation: match.ownerCurrentLocation,
        finderLocation: match.finderCurrentLocation,
        distance,
        eta,
    };
};

// Stop tracking
export const stopTracking = async (matchId, userId) => {
    const match = await Match.findById(matchId);

    if (!match) {
        throw new Error('Match not found');
    }

    if (match.owner.toString() !== userId && match.finder.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    const session = await TrackingSession.findOne({ matchId, status: 'ACTIVE' });
    if (session) {
        session.status = 'COMPLETED';
        session.completedAt = new Date();
        await session.save();
    }

    match.liveTrackingActive = false;
    await match.save();

    // Emit to other user
    emitToOtherUserInMatch(matchId.toString(), userId, 'tracking:stopped', {
        matchId: matchId.toString(),
        stoppedBy: userId,
    });

    return { message: 'Tracking stopped' };
};
