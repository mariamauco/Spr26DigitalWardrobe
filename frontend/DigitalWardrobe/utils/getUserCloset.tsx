import React, { useEffect, useState, useCallback, useRef } from "react";
import { getToken } from "../utils/authStorage";
import { useUser } from "../components/features/userContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const getCloset =  async() => {

    const token = await getToken();
    if (!token) {
        throw "No token found";
    }
    
    // Request all clothing items.
    const response = await fetch(`${API_URL}/api/clothing/`, {
        method: "GET",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });

    const data = await response.json();
    // If backend returns error, expose message and clear stale items.
    if (!response.ok) {
        throw(data?.message || data?.error || "Failed to load closet");
    }

    return data; // if everything worked, return the closet items
}