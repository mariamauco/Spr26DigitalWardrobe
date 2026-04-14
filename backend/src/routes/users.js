import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// PUT /api/users/:id - update name and/or zipCode
router.put("/", requireAuth, async (req, res) => {
  try {
    const { name, zipCode } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (zipCode) updateFields.zipCode = zipCode;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "At least one field must be provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;