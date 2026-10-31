import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  { slug: String, name: String, imageUrl: String, order: Number },
  { versionKey: false },
);

export const Category = mongoose.model('Category', categorySchema);
