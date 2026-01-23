import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['MATCH_FOUND', 'MESSAGE', 'ITEM_VERIFIED', 'STATUS_UPDATE'],
      required: true
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
