import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import fetch from "node-fetch";
import { callModel, modelRoutes } from "../middleware/model.js";

const router = express.Router();

export const weatherTags = (data) => {
    const tags = [];

    const weather = data?.weather?.[0] || {};
    const id = weather?.id || -1;
    const description = weather?.description || ""
    const main = data?.main || {};
    const wind = data?.wind || {};
    const clouds = data?.clouds?.all || -1;
    const visibility = data?.visibility || -1;
    const temp = Number(main.temp);
    const humidity = Number(main.humidity);
    const windSpeed = Number(wind.speed);

    // GET WEATHER TAGS
    const descriptionTag = String(description).toLowerCase();
    if (descriptionTag) tags.push(`condition: ${descriptionTag}`);

    if (id >= 200 && id < 300) tags.push("thunderstorm");
    else if (id >= 300 && id < 600) tags.push("wet weather");
    else if (id >= 600 && id < 700) tags.push("snow weather");
    else if (id >= 700 && id < 800) tags.push("low air quality risk");
    else if (id === 800) tags.push("clear sky");
    else if (id > 800) tags.push("cloudy sky");

    // GET TEMP TAGS
    if (temp >= 88) tags.push("very hot");
    else if (temp >= 78) tags.push("hot");
    else if (temp >= 74) tags.push("warm");
    else if (temp >= 65) tags.push("cool");
    else if (temp >= 42) tags.push("cold");
    else tags.push("freezing");

    // GET WIND TAGS
    if (windSpeed >= 25) tags.push("very windy");
    else if (windSpeed >= 15) tags.push("windy");
    else if (windSpeed >= 8) tags.push("breezy");
    else tags.push("calm");

    // GET HUMIDITY TAGS
    if (humidity >= 85) tags.push("very humid");
    else if (humidity >= 70) tags.push("humid");
    else if (humidity <= 30) tags.push("dry");
    else tags.push("normal humidity");

    // GET VISIBILITY TAGS
    if (visibility >= 9000) tags.push("clear visibility");
    else if (visibility >= 4000) tags.push("moderate visibility");
    else tags.push("low visibility");

    if (clouds >= 85) tags.push("overcast");
    else if (clouds >= 50) tags.push("mostly cloudy");
    else if (clouds >= 20) tags.push("partly cloudy");
    else tags.push("mostly clear");

    // DAY TIME TAGS
    if (data?.dt && data?.sys?.sunrise && data?.sys?.sunset)
        tags.push(data.dt >= data.sys.sunrise && data.dt <= data.sys.sunset ? "daytime" : "nighttime"); 

    return tags;
};

// given a user id, returns the weather api info
const getUserWeather = async (user) => {
    const zip = user.zipCode;
    const countryCode = user.country;
    if (!zip || !countryCode) {
        const err = new Error("User zipcode/country missing");
        err.status = 400;
        throw err;
    }
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?zip=${zip},${countryCode}&units=imperial&appid=${process.env.WEATHER_API_KEY}`
    );
    const data = await response.json();
    if (!response.ok) {
        const err = new Error(data?.message || "Failed to fetch weather");
        err.status = response.status;
        throw err;
    }
    return data;
};

export const dailyOutfit = async (userId) => {

    // get the user
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const weatherData = await getUserWeather(user);
    const tags = weatherTags(weatherData);
    // get user preferneces, might be in onboarding profile
    // const preferences;

    // get user's closet. call get api
    // const closet;

    const payload = {
        userId,
        //preferences,
        //closet,
        weatherTags: tags,
        slots: ["top", "bottom", "outerwear", "footwear", "accessories"],
    };

    const modelResponse = await callModel(modelRoutes.dailyOutfit, payload);
    return modelResponse;
};

// weather route which calls weather API
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const data = await getUserWeather(user);
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// get daily outfit route
router.get("/daily-outfit", authMiddleware, async (req, res) => {
    try {
        const result = await dailyOutfit(req.user.id);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

export default router;