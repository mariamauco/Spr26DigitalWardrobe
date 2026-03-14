import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DashboardSidebar from "../components/features/dashboardSidebar";

export default function ClosetScreen() {
  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <View style={styles.contentWrapper}>
        <DashboardSidebar username="Samantha" activeScreen="closet" />

        <View style={styles.main}>
          <Text style={styles.title}>MY CLOSET</Text>
          <Text style={styles.subtitle}>
            View and organize your wardrobe items here.
          </Text>

          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tops</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bottoms</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Outerwear</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Shoes</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Accessories</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Favorites</Text>
            </View>
          </ScrollView>
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    paddingBottom: 40,
  },

  card: {
    width: 260,
    height: 180,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    color: "#8A5F5F",
    fontSize: 24,
    fontWeight: "400",
    textAlign: "center",
  },
});