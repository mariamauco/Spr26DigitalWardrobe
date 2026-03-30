

import fetch from "node-fetch";

// endpoint for the model
const endpoint = process.env.MODEL_API_URL || "http://138.197.16.179:5000";

// routes from the ml-server 
export const modelRoutes = Object.freeze({
    dailyOutfit: "/generate-daily",
    processImage: "/process-image",
});


// calls the model given the path, payload, and options
export const callModel = async (path, payload, options = {}) => {
    const { method = "POST", headers = {} } = options;
    const url = `${endpoint}${path}`;

    let body;
    const requestHeaders = { ...headers };

    if (payload !== undefined && payload !== null) {
        const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
        if (isFormData) {
            body = payload;
        } else {
            body = JSON.stringify(payload);
            requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
        }
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "string"
            ? data
            : data?.error || data?.message || "Model request failed";
        const err = new Error(message);
        err.status = response.status;
        err.details = data;
        throw err;
    }

    return data;
};

export default callModel;