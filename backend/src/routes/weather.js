import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import fetch from "node-fetch";


const router = express.Router();

router.get("/weather", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const zip = user.zipCode;

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?zip=${zip},US&units=imperial&appid=${process.env.REACT_APP_API_KEY}`
        );


        const data = await response.json();
        res.json(data);

    }   catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;