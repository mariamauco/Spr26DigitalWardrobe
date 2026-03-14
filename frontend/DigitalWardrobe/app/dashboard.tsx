import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";

export default function DashboardScreen() {
  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
		<GridOverlay />
      <View style={styles.contentWrapper}>
        <DashboardSidebar
          username="Samantha"
          activeScreen="dashboard"
          onLogout={() => {
            console.log("Log out pressed");
          }}
        />

        <View style={styles.main}>
          <Text style={styles.greeting}>HELLO, SAMANTHA!</Text>

          <View style={styles.mainRow}>
            <View style={styles.dailyCard}>
              <Text style={styles.cardText}>daily outfit</Text>

              <View style={styles.bottomOutfitsRow}>
                <Text style={styles.cardText}>other outfit</Text>
                <Text style={styles.cardText}>other outfit</Text>
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={styles.weatherCard}>
                <Text style={styles.cardText}>weather forecast</Text>
              </View>

              <View style={styles.smallCard} />
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

  greeting: {
    color: "#4E4E4E",
    fontSize: 40,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    marginBottom: 30,
  },

  mainRow: {
    flexDirection: "row",
    gap: 28,
    alignItems: "flex-start",
  },

  dailyCard: {
    width: 520,
    height: 590,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomOutfitsRow: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 30,
  },

  rightColumn: {
    gap: 28,
  },

  weatherCard: {
    width: 293,
    height: 283,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  smallCard: {
    width: 293,
    height: 275,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
  },

  cardText: {
    color: "#8A5F5F",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
    textAlign: "center",
  },
});