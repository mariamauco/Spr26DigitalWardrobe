// backend/src/models/DailyOutfit.js
import mongoose from "mongoose";

const DailyOutfitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: { type: String, required: true },
    // Outfit is an object with keys like first/second/third, each with slot objects.
    outfit: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// One cache doc per user per local day.
// DailyOutfitSchema.index({ user: 1, dateKey: 1 }, { unique: true });

// Auto-delete expired cache docs.
DailyOutfitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("DailyOutfit", DailyOutfitSchema);