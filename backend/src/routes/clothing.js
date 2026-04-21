import express from "express";
import ClothingItem from "../models/ClothingItem.js";
import auth from "../middleware/auth.js";
import { upload, deleteImage } from "../middleware/upload.js";
import { callModel, modelRoutes } from "../middleware/model.js";
import { model } from "mongoose";

const router = express.Router();

const processImage = async (imagePath) => {
  const modelResult = await callModel(modelRoutes.processImage, { imagePath });

  const type = modelResult?.pred_coarse;
  const subtype = modelResult?.pred_fine;
  const imageEmbedding = modelResult?.imageEmbedding;
  const typeConfidence = modelResult?.coarse_conf;
  const subtypeConfidence = modelResult?.fine_conf;
  const imagePathNoBg = modelResult?.bg_removed_image?.url;
  const styles = modelResult?.pred_style;
  const styleConfidence = modelResult?.style_conf;

  // try common possible color field names from the model response
  const detectedColors =
    modelResult?.colors ||
    modelResult?.pred_colors ||
    modelResult?.dominant_colors ||
    modelResult?.dominantColors ||
    modelResult?.color ||
    [];

  return {
    type,
    subtype,
    imageEmbedding,
    typeConfidence,
    subtypeConfidence,
    imagePathNoBg,
    styles,
    styleConfidence,
    detectedColors,
  };
};

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

    let imagePath = `/uploads/${req.file.filename}`;
    let {
  type,
  subtype,
  imageEmbedding,
  typeConfidence,
  subtypeConfidence,
  imagePathNoBg,
  styles,
  styleConfidence,
  detectedColors,
} = await processImage(imagePath);

console.log("detectedColors from model:", detectedColors);

if (imagePathNoBg) {
  deleteImage(imagePath);
  imagePath = imagePathNoBg;
}

let name = req.body.name;

// colors from frontend if provided, otherwise use model output
const manualColors = parseList(req.body.colors);

console.log("manual colors from req.body:", manualColors);

const colors =
  manualColors.length > 0
    ? manualColors
    : Array.isArray(detectedColors)
      ? detectedColors.map(String).filter(Boolean)
      : detectedColors
        ? [String(detectedColors)]
        : [];

        console.log("final colors saved:", colors);
        
let tags = parseList(req.body.tags);
if (styles) tags.push(styles);

    let message = "Success";
    let require_input = false;

    if (!name)
      name = req.file.filename;


    if (typeConfidence < 0.4){
      message = "We couldn't quite identify this item. Please categorize it manually."
      type = 'not detected';
      subtype = 'not detected';
      require_input = true;
    }

    const item = await ClothingItem.create({
      user: req.user.id,
      name,
      type,
      typeConfidence,
      subtype,
      subtypeConfidence,
      colors,
      tags,
      styleConfidence,
      imagePath,
      imageEmbedding
    });

    const response = {
      message,
      require_input,
      item: item,
    }

    res.status(201).json({response});
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
    deleteImage(item.imagePath);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


export default router;
