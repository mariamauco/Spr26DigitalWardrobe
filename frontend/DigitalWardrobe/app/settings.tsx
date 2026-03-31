import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import { TextInput } from "react-native-paper";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function SettingsScreen() {
  const { user, setUser } = useUser();

    const [name, setName] = useState("");
    const [zipcode, setZipcode] = useState("");

    useEffect(() => {
      setName(user?.name ?? "");
      setZipcode(user?.zipcode ?? "");
    }, [user]);

    const handleSave = () => {
      if (!user) return;

      setUser({
        ...user,
        name,
        zipcode,
      });

      console.log("Saved locally:", { name, zipcode });
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
});