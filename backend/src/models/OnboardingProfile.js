import mongoose from "mongoose";

const OnboardingProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    // Q1: "What style describes you best?" (multi-select)
    styleTags: {
      type: [String],
      default: [],
      trim: true,
    },

    // Q2: "What silhouettes do you prefer?" (multi-select)
    silhouetteTags: {
      type: [String],
      default: [],
      trim: true,
    },

    // Q3: Comfort (0) <-> Trendy (1)
    comfort: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },

    // Q4: Not at all (0) <-> Bold (1)
    experimental: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },

    // Optional: mark onboarding completion
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//OnboardingProfileSchema.index({ user: 1 });

export default mongoose.model("OnboardingProfile", OnboardingProfileSchema);