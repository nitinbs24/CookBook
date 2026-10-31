import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
);

export const Like = mongoose.model('Like', likeSchema);
