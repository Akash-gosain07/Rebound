import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
