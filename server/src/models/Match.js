import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    matchId: { type: String, unique: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    finder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'MATCHED', 'OTP_SENT', 'VERIFIED', 'RECOVERED', 'HELD_AT_HELP_DESK'],
      default: 'REQUESTED',
    },
    handoverType: {
      type: String,
      enum: ['DIRECT', 'HELP_DESK'],
      default: 'DIRECT'
    },
    verificationAuthority: {
      type: String,
      enum: ['FINDER', 'HELP_DESK'],
      default: 'FINDER'
    },
    meetLocation: {
      label: { type: String, default: 'Spot B5' },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      preferredTiming: String,
      isLocked: { type: Boolean, default: false },
      type: { type: String, enum: ['SAFE_POINT', 'MANUAL'], default: 'SAFE_POINT' },
      suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      changeRequests: [{
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        location: {
          label: String,
          lat: Number,
          lng: Number
        },
        status: {
          type: String,
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          default: 'PENDING'
        },
        createdAt: { type: Date, default: Date.now }
      }]
    },
    meetWindow: {
      start: { type: Date },
      end: { type: Date },
    },

    // Live tracking
    liveTrackingActive: { type: Boolean, default: false },
    ownerCurrentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date,
    },
    finderCurrentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date,
    },

    // OTP verification
    ownerOTP: {
      code: String,  // Hashed
      generated: { type: Boolean, default: false },
      expiresAt: Date,
    },
    finderOTP: {
      code: String,  // Hashed
      generated: { type: Boolean, default: false },
      expiresAt: Date,
    },

    ownerVerified: { type: Boolean, default: false },
    finderVerified: { type: Boolean, default: false },

    // Meetup completion
    meetupCompleted: { type: Boolean, default: false },
    completedAt: Date,

    helpDesk: {
      handedOverAt: Date,
      location: {
        label: String,
        lat: Number,
        lng: Number,
        preferredTiming: String
      },
      verifiedByHelpDesk: { type: Boolean, default: false }
    },

    // Audit Logging
    statusHistory: [{
      status: { type: String, required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      note: String
    }]
  },
  { timestamps: true }
);

export const Match = mongoose.model('Match', matchSchema);

