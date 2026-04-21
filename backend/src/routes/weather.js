import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import ClothingItem from "../models/ClothingItem.js";
import fetch from "node-fetch";
import { callModel, modelRoutes } from "../middleware/model.js";
import OnboardingProfile from "../models/OnboardingProfile.js";
import { model } from "mongoose";
import DailyOutfit from "../models/DailyOutfit.js";

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

    const OUTFIT_SLOTS = ["top", "bottom", "outerwear", "shoe", "accessory", "one_piece"];

    const emptyItem = { id: "", imagePath: "" };

    const hydrateOutfitResponse = (rawOutfits, closetItems) => {
        if (!rawOutfits || typeof rawOutfits !== "object") return rawOutfits;

        const byId = new Map(
            (closetItems || []).map((item) => [String(item?._id), item?.imagePath || ""])
        );

        const hydrated = {};

        for (const [outfitKey, outfitVal] of Object.entries(rawOutfits)) {
            if (!outfitVal || typeof outfitVal !== "object") {
                hydrated[outfitKey] = outfitVal;
                continue;
            }

            const nextOutfit = {};
            for (const slot of OUTFIT_SLOTS) {
                const slotVal = outfitVal[slot];

                if (!slotVal) {
                    nextOutfit[slot] = emptyItem;
                    continue;
                }

                if (typeof slotVal === "object" && "id" in slotVal && "imagePath" in slotVal) {
                    nextOutfit[slot] = {
                        id: slotVal.id || "",
                        imagePath: slotVal.imagePath || "",
                    };
                    continue;
                }

                if (typeof slotVal === "string") {
                    const imagePath = byId.get(slotVal) || "";
                    nextOutfit[slot] = { id: slotVal, imagePath };
                    continue;
                }

                nextOutfit[slot] = emptyItem;
            }

            hydrated[outfitKey] = nextOutfit;
        }

        return hydrated;
    };

    // Get the user's profile from the database using their ID.
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    // 1. Fetch current weather for the user's zipcode/country.
    const weatherData = await getUserWeather(user);

    // 2. Check if there is an outfit already
    const tz = Number(weatherData.timezone || 0);
    const userTime = Date.now() + tz*1000
    const userDate = new Date(userTime)
    // dateKey: YYYY-MM-DD
    const y = userDate.getUTCFullYear();
    const m = userDate.getUTCMonth() + 1;
    const d = userDate.getUTCDate();

    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateKey = `${y}-${mm}-${dd}`;

    const nextLocalMidnightShiftedMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0);
    const expiresAt = new Date(nextLocalMidnightShiftedMs - tz * 1000);

    // 6. Load all clothing items in the user's closet.
    const closet = await ClothingItem.find({user: userId}).sort({ createdAt: -1 });

    // look for the cache for this day, if found --> return it
    const cache = await DailyOutfit.findOne({ user: userId, dateKey, expiresAt: { $gt: new Date() },}).lean();
    if(cache?.outfit) {
        return hydrateOutfitResponse(cache.outfit, closet);
    };

    // 3. Convert raw weather response into ML-friendly weather tags.
    const tags = weatherTags(weatherData);

    // 4. Find this user's onboarding profile to read styling preferences.
    const onboarding = await OnboardingProfile.findOne({user: userId});

    // 5. Keep only preference fields needed by the model.
    //    These labels shape outfit generation style and comfort level.

    // no onboarding found with user
    if(!onboarding){
        const err = new Error("No Onboarding profile found.");
        err.status = 404;
        throw err;
    }

    const preferences = {
        comfort: onboarding.comfort,
        experimental: onboarding.experimental,
        silhouetteTags: onboarding.silhouetteTags,
        styleTags: onboarding.styleTags
    }

    // 7. Build the request payload for the daily outfit model route.
    const payload = {
        userId,
        preferences,
        closet,
        weatherTags: tags,
        slots: ["top", "bottom", "outerwear", "shoe", "accessory", "one_piece"],
    };

    // 8. Call the ML model with preferences, closet items, and weather tags.
    const modelResponse = await callModel(modelRoutes.dailyOutfit, payload);

    let response = hydrateOutfitResponse(modelResponse, closet);

    // 9. Save to cache.
    await DailyOutfit.findOneAndUpdate(
        { user: userId, dateKey },
        { user: userId, dateKey, outfit: response, expiresAt },
        { upsert: true, setDefaultsOnInsert: true }
    );
        
    // 10. Return the model response back to the route handler.
    return response;
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