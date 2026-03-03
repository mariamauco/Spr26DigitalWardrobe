import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import fetch from "node-fetch";


const router = express.Router();

router.get("/weather", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const zip = user.zipCode;
        const countryCode = user.country

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?zip=${zip},${countryCode}&units=imperial&appid=${process.env.WEATHER_API_KEY}`
        );


        const data = await response.json();
        res.json(data);

    }   catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;