import express from "express";
import ProfilePic from "../models/ProfilePic.js";
import auth from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// POST /api/profile-pic — upload or replace
router.post("/", auth, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const user = req.user.id;
    const image_path = `/uploads/${req.file.filename}`;

    // check if user already has a profile pic
    const existing = await ProfilePic.findOne({ user });

    if (existing) {
      
      const oldPath = path.join(process.cwd(), existing.image_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      // update the record
      existing.image_path = image_path;
      await existing.save();

      return res.status(200).json({ message: "Profile picture updated", profilePic: existing });
    }

    // first time — create new record
    const profilePic = await ProfilePic.create({ user, image_path });

    res.status(201).json({ message: "Profile picture uploaded", profilePic });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/profile-pic — get current user's photo
router.get("/", auth, async (req, res) => {
  try {
    const profilePic = await ProfilePic.findOne({ user: req.user.id });

    if (!profilePic) {
      return res.status(404).json({ message: "No profile picture found" });
    }

    res.status(200).json({ profilePic });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;