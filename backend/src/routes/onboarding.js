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
    const {
      styleTags,
      silhouetteTags,
      comfort,
      experimental,
      completed,
    } = req.body;

    const update = {};

    // Multi-select arrays
    if (styleTags !== undefined) {
      update.styleTags = Array.isArray(styleTags)
        ? styleTags.map((s) => String(s).trim()).filter(Boolean)
        : [];
    }

    if (silhouetteTags !== undefined) {
      update.silhouetteTags = Array.isArray(silhouetteTags)
        ? silhouetteTags.map((s) => String(s).trim()).filter(Boolean)
        : [];
    }

    // Sliders (0..10)
    if (comfort !== undefined) {
      const v = Number(comfort);
      if (Number.isNaN(v)) return res.status(400).json({ error: "comfort level must be a number" });
      update.comfort = Math.max(0, Math.min(10, v));
    }

    if (experimental !== undefined) {
      const v = Number(experimental);
      if (Number.isNaN(v)) return res.status(400).json({ error: "experimental level must be a number" });
      update.experimental = Math.max(0, Math.min(10, v));
    }

    // Completion flag
    if (completed !== undefined) update.completed = Boolean(completed);

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