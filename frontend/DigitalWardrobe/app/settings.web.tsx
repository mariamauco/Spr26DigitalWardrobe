import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import { TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function SettingsScreen() {
  const { user, setUser } = useUser();

  const [name, setName] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setZipcode(user?.zipCode ?? "");

    const fetchProfilePic = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_URL}/api/profile-pic`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProfilePicUrl(`${API_URL}${data.profilePic.image_path}`);
        }
      } catch (err) {
        console.error("Error fetching profile pic:", err);
      }
    };
    fetchProfilePic();

  }, [user]);

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

    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const handlePickImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const token = await AsyncStorage.getItem("token");
        const formData = new FormData();
        formData.append("profilePic", file);

        const response = await fetch(`${API_URL}/api/profile-pic`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setProfilePicUrl(`${API_URL}${data.profilePic.image_path}`);
        }
      } catch (err) {
        console.error("Error uploading profile pic:", err);
      }
    };
    input.click();
  };

  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <GridOverlay />
      <View style={styles.contentWrapper}>
        <DashboardSidebar
          activeScreen="settings"
          username={user?.name || "User"}
        />

        <View style={styles.main}>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>
            Manage your account.
          </Text>

          <View style={styles.settingsCard}>

            {/* profile photo */}
            <View style={styles.photoBlock}>
              <Pressable onPress={handlePickImage}>
                {profilePicUrl ? (
                  <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account-outline" size={40} color="#B7A6A6" />
                  </View>
                )}
              </Pressable>
              <Pressable onPress={handlePickImage}>
                <Text style={styles.changePhotoText}>change photo</Text>
              </Pressable>
            </View>

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

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>save</Text>
            </Pressable>

          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
    gap: 20,
  },

  main: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
  },

  title: {
    color: "#4E4E4E",
    fontSize: 40,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    marginBottom: 10,
  },

  subtitle: {
    color: "#8A7A7A",
    fontSize: 18,
    marginBottom: 28,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  settingsCard: {
    width: "100%",
    maxWidth: 700,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    padding: 28,
    gap: 24,
  },

  settingRow: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "rgba(245, 237, 237, 0.55)",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLabel: {
    color: "#8A5F5F",
    fontSize: 20,
    fontFamily: "DMSerifDisplay_400Regular",
  },

  settingBlock: {
    gap: 10,
  },

  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(245, 237, 237, 0.55)",
    paddingHorizontal: 20,
    color: "#4E4E4E",
    fontSize: 18,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  saveButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#8A5F5F",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },

  saveButtonText: {
    color: "#FEFDF4",
    fontSize: 16,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    textTransform: "lowercase",
  },

  photoBlock: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138,95,95,0.1)",
    marginBottom: 4,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(245,237,237,0.55)",
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(245,237,237,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  changePhotoText: {
    color: "#8A5F5F",
    fontSize: 13,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
});