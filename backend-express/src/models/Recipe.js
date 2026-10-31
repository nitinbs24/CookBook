import mongoose from 'mongoose';

const { Schema } = mongoose;
// _id:false on embedded items so documents match the FastAPI ones (TRD D4).
const sub = (fields) => new Schema(fields, { _id: false });

const recipeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    dishName: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    foodType: { type: String, enum: ['veg', 'nonveg'], required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    servings: { type: Number, required: true },
    prepTimeMin: { type: Number, required: true },
    cookTimeMin: { type: Number, required: true },
    images: [sub({ url: { type: String, required: true }, publicId: { type: String, required: true } })],
    ingredients: [
      sub({
        name: { type: String, required: true },
        quantity: { type: Number, default: null },
        unit: { type: String, default: null },
        note: { type: String, default: null },
      }),
    ],
    instructions: [
      sub({
        section: { type: String, default: null },
        steps: [
          sub({
            text: { type: String, required: true },
            durationMin: { type: Number, default: null },
            tip: { type: String, default: null },
          }),
        ],
      }),
    ],
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true },
);

export const Recipe = mongoose.model('Recipe', recipeSchema);
