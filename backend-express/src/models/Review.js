import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    comment: { type: String, default: null },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
);

export const Review = mongoose.model('Review', reviewSchema);
