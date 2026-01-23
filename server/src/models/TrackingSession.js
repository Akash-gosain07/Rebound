import mongoose from 'mongoose';

const trackingSessionSchema = new mongoose.Schema(
    {
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        finder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },

        status: {
            type: String,
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            default: 'ACTIVE',
        },

        ownerLocation: {
            lat: Number,
            lng: Number,
            lastUpdated: Date,
        },

        finderLocation: {
            lat: Number,
            lng: Number,
            lastUpdated: Date,
        },

        startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        startedAt: { type: Date, default: Date.now },
        completedAt: Date,

        // OTP Verification
        ownerOtp: { type: String }, // The OTP the owner must provide to the finder (or vice-versa depending on flow)
        finderOtp: { type: String },
        otpVerifiedByOwner: { type: Boolean, default: false },
        otpVerifiedByFinder: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const TrackingSession = mongoose.model('TrackingSession', trackingSessionSchema);
