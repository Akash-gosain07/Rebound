import { Match } from '../models/Match.js';
import { emitToUser, emitToOtherUserInMatch } from '../config/socket.js';

// Calculate midpoint between two coordinates
export const calculateMidpoint = (lat1, lng1, lat2, lng2) => {
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    return { lat: midLat, lng: midLng };
};

// Suggest meetup location (midpoint)
export const suggestMeetupLocation = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('owner finder item');

    if (!match) {
        throw new Error('Match not found');
    }

    // Get item locations
    const Item = (await import('../models/Item.js')).Item;
    const lostItem = await Item.findOne({ _id: match.item._id, type: 'LOST' });
    const foundItem = await Item.findOne({ type: 'FOUND', /* match criteria */ });

    if (lostItem && foundItem && lostItem.location && foundItem.location) {
        const midpoint = calculateMidpoint(
            lostItem.location.coordinates[1],
            lostItem.location.coordinates[0],
            foundItem.location.coordinates[1],
            foundItem.location.coordinates[0]
        );

        match.meetLocation = {
            ...match.meetLocation,
            lat: midpoint.lat,
            lng: midpoint.lng,
            label: 'Suggested Midpoint',
            suggestedBy: userId,
        };

        await match.save();
    }

    return match.meetLocation;
};

// Request location change
export const requestLocationChange = async (matchId, userId, newLocation) => {
    const match = await Match.findById(matchId).populate('owner finder');

    if (!match) {
        throw new Error('Match not found');
    }

    if (match.owner._id.toString() !== userId && match.finder._id.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    // Add change request
    match.meetLocation.changeRequests.push({
        requestedBy: userId,
        location: newLocation,
        status: 'PENDING',
    });

    await match.save();

    // Notify other user
    emitToOtherUserInMatch(matchId.toString(), userId, 'location:change_requested', {
        matchId: matchId.toString(),
        requestedBy: userId,
        newLocation,
    });

    return match.meetLocation;
};

// Approve location change
export const approveLocationChange = async (matchId, userId, requestIndex) => {
    const match = await Match.findById(matchId).populate('owner finder');

    if (!match) {
        throw new Error('Match not found');
    }

    if (match.owner._id.toString() !== userId && match.finder._id.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    const request = match.meetLocation.changeRequests[requestIndex];
    if (!request) {
        throw new Error('Request not found');
    }

    // Update request status
    request.status = 'APPROVED';

    // Update meetup location
    match.meetLocation.lat = request.location.lat;
    match.meetLocation.lng = request.location.lng;
    match.meetLocation.label = request.location.label || 'Custom Location';

    if (!match.meetLocation.approvedBy) {
        match.meetLocation.approvedBy = [];
    }
    match.meetLocation.approvedBy.push(userId);

    await match.save();

    // Notify other user
    emitToOtherUserInMatch(matchId.toString(), userId, 'location:approved', {
        matchId: matchId.toString(),
        approvedBy: userId,
        newLocation: match.meetLocation,
    });

    return match.meetLocation;
};

// Reject location change
export const rejectLocationChange = async (matchId, userId, requestIndex) => {
    const match = await Match.findById(matchId).populate('owner finder');

    if (!match) {
        throw new Error('Match not found');
    }

    if (match.owner._id.toString() !== userId && match.finder._id.toString() !== userId) {
        throw new Error('Unauthorized');
    }

    const request = match.meetLocation.changeRequests[requestIndex];
    if (!request) {
        throw new Error('Request not found');
    }

    // Update request status
    request.status = 'REJECTED';
    await match.save();

    // Notify other user
    emitToOtherUserInMatch(matchId.toString(), userId, 'location:rejected', {
        matchId: matchId.toString(),
        rejectedBy: userId,
    });

    return match.meetLocation;
};

// Get active meetups for user
export const getActiveMeetups = async (userId) => {
    const matches = await Match.find({
        $or: [{ owner: userId }, { finder: userId }],
        status: { $in: ['MATCHED', 'OTP_SENT', 'VERIFIED'] },
        meetupCompleted: false,
    }).populate('owner finder item');

    return matches;
};
