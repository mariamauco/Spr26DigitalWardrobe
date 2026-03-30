import express from "express";
import ClothingItem from "../models/ClothingItem.js";
import auth from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import fs from "fs";
import path from "path";

const router = express.Router();



//     CREATE CLOTHING ITEM     //
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // helper to accept either JSON array or comma-separated strings
    const parseList = (val) => {
      if (!val) return [];
      // If frontend sends JSON like '["blue","white"]'
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        // fallback: "blue, white"
        return String(val)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    };

    const { name, type } = req.body;
    const colors = parseList(req.body.colors);
    const tags = parseList(req.body.tags);
    if (!name)
        name = req.file.filename;

    const imagePath = `/uploads/${req.file.filename}`;

    const item = await ClothingItem.create({
      user: req.user.id,
      name,
      type,
      colors,
      tags,
      imagePath,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//    GET ALL CLOTHING ITEMS FOR USER     //
router.get("/", auth, async (req, res) => {
    try {
        const {type, color, tag} = req.query;
        const query = { user: req.user.id };

        if (type) query.type = type;
        if (color) query.colors = color;   // matches array containing color
        if (tag) query.tags = tag;         // matches array containing tag

        const items = await ClothingItem.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//      GET ONE ITEM    //
router.get("/:id", auth, async (req, res) => {
    try {
        const item = await ClothingItem.findOne({ _id: req.params.id, user: req.user.id });
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//      UPDATE ITEM     //
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await ClothingItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//     DELETE ITEM     //
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await ClothingItem.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) return res.status(404).json({ message: "Not found" });

    // Remove the actual file from /uploads
    const absolutePath = path.join(process.cwd(), item.imagePath); // item.imagePath starts with /uploads/...
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


export default router;
