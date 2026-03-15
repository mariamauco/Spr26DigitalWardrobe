import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useUser } from "./userContext";
import { removeToken } from "../../app/authStorage";

type DashboardSidebarProps = {
    username?: string;
    activeScreen?: "dashboard" | "closet" | "settings";
    onLogout?: () => void;
  };

export default function DashboardSidebar({
  username,
  activeScreen = "dashboard",
}: DashboardSidebarProps) {
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    router.replace("/logIn");
  };

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Digital Wardrobe</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar} />
        <Text style={styles.username}>
          {user?.name ?? "User"}
        </Text>
      </View>

      <View style={styles.navSection}>
        <SidebarButton
          label="Dashboard"
          isActive={activeScreen === "dashboard"}
          onPress={() => router.push("/dashboard")}
        />

        <SidebarButton
          label="My Closet"
          isActive={activeScreen === "closet"}
          onPress={() => router.push("/closet")}
        />

        <SidebarButton
          label="Settings"
          isActive={activeScreen === "settings"}
          onPress={() => router.push("/settings")}
        />
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={async () => {
          await removeToken();
          router.replace("/logIn");
        }}
      >
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

type SidebarButtonProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

function SidebarButton({
  label,
  isActive = false,
  onPress,
}: SidebarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        isActive && styles.activeNavButton,
        pressed && styles.pressedButton,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 290,
    backgroundColor: "rgba(236, 221, 221, 0.6)",
    borderRadius: 30,
    paddingTop: 42,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: "space-between",
  },

  logo: {
    color: "#8A5F5F",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 48,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 44,
    gap: 16,
  },

  avatar: {
    width: 60,
    height: 78,
    borderRadius: 28,
    backgroundColor: "#F7F5F2",
  },

  username: {
    color: "#4E4E4E",
    fontSize: 20,
    fontFamily: "DMSerifDisplay_400Regular",
  },

  navSection: {
    gap: 20,
    marginTop: 8,
    flex: 1,
  },

  navButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "rgba(245, 237, 237, 0.89)",
    justifyContent: "center",
    alignItems: "center",
  },

  activeNavButton: {
    shadowColor: "#D6BDBD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },

  pressedButton: {
    opacity: 0.8,
  },

  logoutButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "rgba(245, 237, 237, 0.89)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D6BDBD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 24,
  },

  buttonText: {
    color: "#8A5F5F",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
  },
});