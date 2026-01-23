import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, unique: true, sparse: true },
    type: { type: String, enum: ['LOST', 'FOUND', 'lost', 'found'], required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    photoUrl: { type: String },
    photos: [{ type: String }],
    description: { type: String },
    petDetails: {
      breed: { type: String },
      identicalMark: { type: String },
      petName: { type: String },
      allergicTo: { type: String },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      address: { type: String },
    },
    status: { type: String, enum: ['ACTIVE', 'MATCHED', 'RECOVERED'], default: 'ACTIVE' },
    verified: { type: Boolean, default: false },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Item = mongoose.model('Item', itemSchema);
