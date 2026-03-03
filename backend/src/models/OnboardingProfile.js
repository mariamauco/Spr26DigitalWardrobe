import mongoose from "mongoose";

const OnboardingProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },

    styleTags: [{ type: String, trim: true }],
    ventureLevel: { type: Number, min: 0, max: 10, default: 5 },
    comfortLevel: { type: Number, min: 0, max: 10, default: 5 },
    casualLevel: { type: Number, min: 0, max: 10, default: 5 },

    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("OnboardingProfile", OnboardingProfileSchema);