import React, { useEffect, useState } from "react";
import {View, Text, StyleSheet, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import { TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function SettingsScreen() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [saved, setSaved] = useState(false);

  // fetch full user profile 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/auth/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
          setName(data.name ?? "");
          setZipcode(data.zipCode ?? "");
        }
      } catch (err) {
        console.error("Error fetching user in settings:", err);
      }
    };

    fetchUser();
  }, []);


  const handleSave = async () => {
    if (!user) return;

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, zipCode: zipcode }),
      });

      if (!response.ok) {
        console.error("Failed to update user:", await response.text());
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      console.log("Saved to backend:", updatedUser);

      // show brief confirmation
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <GridOverlay />

      {/* KeyboardAvoidingView so the keyboard doesn't cover the inputs */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* status bar spacer */}
          <View style={styles.statusSpacer} />

          {/* ── Header ── */}
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>Manage your account.</Text>

          {/* ── Settings card ── */}
          <View style={styles.settingsCard}>

            {/* Name */}
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#B7A6A6"
              />
            </View>

            {/* Zip code */}
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>Zip Code</Text>
              <TextInput
                style={styles.input}
                value={zipcode}
                onChangeText={setZipcode}
                placeholder="Enter your zip code"
                placeholderTextColor="#B7A6A6"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            {/* Save button */}
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {saved ? "saved ✓" : "save"}
              </Text>
            </Pressable>

          </View>

          {/* bottom padding so content clears tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom tab bar ── */}
      <View style={styles.tabBar}>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/dashboard")}>
          <MaterialCommunityIcons name="home-outline" size={24} color="#b0968e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="plus-circle-outline" size={32} color="#b0968e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/closet")}>
          <MaterialCommunityIcons name="hanger" size={24} color="#b0968e" />
        </TouchableOpacity>

        {/* settings is active so use rose color */}
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="tune-variant" size={24} color="#8A5F5F" />
        </TouchableOpacity>

      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
  },

  // pushes content below phone status bar
  statusSpacer: {
    height: 80,
  },

  title: {
    color: "#4E4E4E",
    fontSize: 30,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    marginBottom: 6,
  },

  subtitle: {
    color: "#8A7A7A",
    fontSize: 15,
    marginBottom: 24,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  // settings card
  settingsCard: {
    width: "100%",
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    padding: 24,
    gap: 20,
  },

  settingBlock: {
    gap: 8,
  },

  settingLabel: {
    color: "#8A5F5F",
    fontSize: 18,
    fontFamily: "DMSerifDisplay_400Regular",
  },

  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(245, 237, 237, 0.55)",
    paddingHorizontal: 16,
    color: "#4E4E4E",
    fontSize: 16,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  saveButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#8A5F5F",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },

  saveButtonText: {
    color: "#FEFDF4",
    fontSize: 15,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    textTransform: "lowercase",
  },

  // bottom tab bar
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: "rgba(254,253,244,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(138,95,95,0.15)",
  },

  tabItem: {
    alignItems: "center",
  },
});