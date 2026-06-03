import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

// Update user rating after saving feedback
feedbackSchema.post('save', async function () {
    const feedback = this;
    const User = mongoose.model('User');

    const feedbacks = await mongoose.model('Feedback').find({ to: feedback.to });
    const count = feedbacks.length;
    const avg = feedbacks.reduce((acc, f) => acc + f.rating, 0) / count;

    await User.findByIdAndUpdate(feedback.to, {
        rating: avg,
        reviewCount: count
    });
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);
