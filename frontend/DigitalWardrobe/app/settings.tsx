import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DashboardSidebar from "../components/features/dashboardSidebar";

export default function SettingsScreen() {
  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <View style={styles.contentWrapper}>
        <DashboardSidebar username="Samantha" activeScreen="settings" />

        <View style={styles.main}>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>
            Manage your account and wardrobe preferences.
          </Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch value={true} />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch value={false} />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weather-Based Suggestions</Text>
              <Switch value={true} />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Account</Text>
              <Text style={styles.settingValue}>Samantha</Text>
            </View>
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
    fontWeight: "400",
    marginBottom: 10,
  },

  subtitle: {
    color: "#8A7A7A",
    fontSize: 18,
    marginBottom: 28,
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
    fontWeight: "400",
  },

  settingValue: {
    color: "#4E4E4E",
    fontSize: 18,
  },
});