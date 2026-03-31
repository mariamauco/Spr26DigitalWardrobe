import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; 
import path from "path";
import clothingRoutes from "./routes/clothing.js";
import onboardingRoutes from "./routes/onboarding.js";
import weatherRoutes from "./routes/weather.js";
import userRoutes from "./routes/users.js";

const app = express();
app.use(cors()); // allows front end to call backend
app.use(express.json()); // allows server to read json



//      HEALTH TEST     //
app.get("/health", (_, res) => res.json({ ok: true })); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MONGO_URI:", process.env.MONGO_URI);
    console.log("Connected DB:", mongoose.connection.db?.databaseName || mongoose.connection.name);
    app.listen(process.env.PORT || 5000, '0.0.0.0', () => console.log("API running"));
  })
  .catch((err) => console.error("Mongo connection error:", err));



app.use(cors({ origin: "*" })); // or http://localhost:5173 for prod

//app.use(cors({ origin: "*" })); // or "*" for testing
app.use("/api/auth", authRoutes);  

// UPLOADING IMAGES //
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CLOTHING ROUTES //
app.use("/api/clothing", clothingRoutes);

// ONBOARDING ROUTES //
app.use("/api/onboarding", onboardingRoutes);

app.use("/api/weather", weatherRoutes);


//https://api.openweathermap.org/data/2.5/weather?lat=44.34&lon=10.99&appid=a136e95903135fc736e4af312c8d23bc&units=imperial