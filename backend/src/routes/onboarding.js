import express from "express";
import OnboardingProfile from "../models/OnboardingProfile.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// GET current user's onboarding profile
router.get("/", requireAuth, async (req, res) => {
  try {
    const profile = await OnboardingProfile.findOne({ user: req.user.id });
    return res.status(200).json(profile || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.get("/ping", (req, res) => res.send("onboarding mounted"));

// POST create/update onboarding profile
router.post("/", requireAuth, async (req, res) => {
  try {
    const { styleTags, ventureLevel, comfortLevel, casualLevel, completed } = req.body;

    const update = {
      ...(styleTags !== undefined ? { styleTags } : {}),
      ...(ventureLevel !== undefined ? { ventureLevel } : {}),
      ...(comfortLevel !== undefined ? { comfortLevel } : {}),
      ...(casualLevel !== undefined ? { casualLevel } : {}),
      ...(completed !== undefined ? { completed: Boolean(completed) } : {})
    };

    const profile = await OnboardingProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: update, $setOnInsert: { user: req.user.id } },
      { new: true, upsert: true }
    );

    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;