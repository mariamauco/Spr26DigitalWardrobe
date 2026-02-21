import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; 
import path from "path";
import clothingRoutes from "./routes/clothing.js";

const app = express();
app.use(cors()); // allows front end to call backend
app.use(express.json()); // allows server to read json


//      HEALTH TEST     //
app.get("/health", (_, res) => res.json({ ok: true })); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5050, '0.0.0.0', () =>
      console.log("API running")
    );
  })
  .catch(console.error);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo connected");
    app.listen(process.env.PORT || 5000, () => console.log("API running"));
  })
  .catch((err) => console.error("Mongo connection error:", err));

app.use(cors({ origin: "http://localhost:5173" })); // or "*" for quick testing
app.use("/api/auth", authRoutes);  

// UPLOADING IMAGES //
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CLOTHING ROUTES //
app.use("/api/clothing", clothingRoutes);
