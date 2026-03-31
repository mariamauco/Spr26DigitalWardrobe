import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import { getToken } from "../app/authStorage";
import { useUser } from "../components/features/userContext";

type ClothingItem = {
  _id: string;
  user: string;
  name: string;
  type: string;
  colors?: string[];
  tags?: string[];
  imagePath: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function ClosetScreen() {

  const { user } = useUser();

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCloset = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        if (!token) {
          setError("No token found");
          return;
        }

        const response = await fetch(`${API_URL}/api/clothing/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        console.log("Closet status:", response.status);
        console.log("Closet response:", data);

        if (!response.ok) {
          setError(data?.message || data?.error || "Failed to load closet");
          setItems([]);
          return;
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("Closet fetch error:", err);
        setError("Network error while loading closet");
      } finally {
        setLoading(false);
      }
    };

    loadCloset();
  }, []);

  const tops = useMemo(
    () => items.filter((item) => item.type?.toLowerCase() === "top"),
    [items]
  );

  const bottoms = useMemo(
    () => items.filter((item) => item.type?.toLowerCase() === "bottom"),
    [items]
  );

  const onePieces = useMemo(
    () =>
      items.filter((item) => {
        const type = item.type?.toLowerCase();
        return type === "one piece" || type === "one-piece" || type === "dress";
      }),
    [items]
  );

  const shoes = useMemo(
    () =>
      items.filter((item) => {
        const type = item.type?.toLowerCase();
        return type === "shoe" || type === "shoes" || type === "footwear";
      }),
    [items]
  );

  const otherItems = useMemo(
    () =>
      items.filter((item) => {
        const type = item.type?.toLowerCase();
        return !["top", "bottom", "one piece", "one-piece", "dress", "shoe", "shoes", "footwear"].includes(type);
      }),
    [items]
  );

  const renderSection = (title: string, sectionItems: ClothingItem[]) => (
    <View style={styles.sectionCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      {sectionItems.length === 0 ? (
        <Text style={styles.emptyText}>No items yet</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsRow}
        >
          {sectionItems.map((item) => (
            <View key={item._id} style={styles.itemCard}>
              <Image
                source={{ uri: `${API_URL}}${item.imagePath}` }}
                style={styles.itemImage}
              />
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
  
  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <GridOverlay />
      <View style={styles.contentWrapper}>
      <DashboardSidebar 
        activeScreen="closet" 
        username={user?.name || "User"}
        />

        <View style={styles.main}>
          <Text style={styles.title}>MY CLOSET</Text>
          <Text style={styles.subtitle}>
            View and organize your wardrobe items here.
          </Text>

          {loading ? (
            <Text style={styles.statusText}>loading closet...</Text>
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : (
            <ScrollView
              contentContainerStyle={styles.sections}
              showsVerticalScrollIndicator={false}
            >
              {renderSection("Tops", tops)}
              {renderSection("Bottoms", bottoms)}
              {renderSection("One Pieces", onePieces)}
              {renderSection("Shoes", shoes)}
              {renderSection("Other", otherItems)}
            </ScrollView>
          )}
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

  statusText: {
    color: "#8A5F5F",
    fontSize: 18,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  sections: {
    gap: 22,
    paddingBottom: 40,
  },

  sectionCard: {
    width: "100%",
    minHeight: 180,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },

  cardTitle: {
    color: "#8A5F5F",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 16,
  },
  emptyText: {
    color: "#8A7A7A",
    fontSize: 16,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  itemsRow: {
    gap: 16,
    paddingRight: 16,
  },

  itemCard: {
    width: 120,
    alignItems: "center",
  },

  itemImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "rgba(245, 237, 237, 0.4)",
  },
  
  itemName: {
    color: "#4E4E4E",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
});