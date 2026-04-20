import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import GridOverlay from "../components/features/gridoverlay";
import ItemEditModal from "../components/features/itemEditModal";
import ItemCard from "../components/ui/ItemCard";
import { ClothingItem, SectionKey, SECTION_KEYS, typeToSectionKey } from "../components/features/labels";
import { getCloset } from "@/utils/getUserCloset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UploadProvider, UploadCard, ItemCard as UploadItemCard, useUploadContext } from "../components/features/uploadItem";

function toSectionTitle(key: SectionKey): string {
  if (key === "onePieces") return "One Pieces";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// Main closet screen for mobile:
// 1) loads clothing items
// 2) groups them by section
// 3) renders horizontal carousels per section
// 4) opens the edit modal for updates/deletes
export default function ClosetScreen() {

  // 1. INITIAL STATE

  const router = useRouter();

  // API data + page status.
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controls which item is open in ItemEditModal. null means modal closed.
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  // Initial data load.
  // Runs once on mount, fetches all closet items for current user token.
  useEffect(() => {
    const loadCloset = async () => {

      try {
        // Enter loading state and clear previous error before request.
        setLoading(true);
        setError(null);

        // getCloset returns the user's clothing items.
        const data = await getCloset();

        // Keep only array
        const loaded: ClothingItem[] = Array.isArray(data) ? data : [];
        setItems(loaded);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load closet items.";
        console.log("Closet fetch error:", err);
        setError(message);

      } finally {
        // Always leave loading state once request path finishes.
        setLoading(false);
      }
    };

    loadCloset();
  }, []);

  // loads items into section lists
  const itemsBySection = useMemo<Record<SectionKey, ClothingItem[]>>(() => {
    const grouped: Record<SectionKey, ClothingItem[]> = {
      tops: [],
      bottoms: [],
      onePieces: [],
      outerwear: [],
      shoes: [],
      accessories: [],
      other: [],
    };

    for (const item of items) {
      const mapped = typeToSectionKey.get(item.type?.toLowerCase());
      const sectionKey: SectionKey = (mapped as SectionKey) ?? "other";
      grouped[sectionKey].push(item);
    }
    return grouped;
  }, [items]);

  // Called when modal saves an edited item.
  // Replaces the matching item in state by _id.
  const handleSave = useCallback((updated: ClothingItem) => {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  }, []);
  
  // Called when modal deletes an item.
  // Removes it from local state so UI updates immediately.
  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

function UploadPlusButton() {
  const { handlePickImage } = useUploadContext();

  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePickImage}>
      <MaterialCommunityIcons name="plus-circle-outline" size={32} color="#b0968e" />
    </TouchableOpacity>
  );
}

return (
  <UploadProvider>
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      {/* Decorative background overlay grid. */}
      <GridOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pushes content below status bar. */}
        <View style={styles.statusSpacer} />

        <Text style={styles.title}>MY CLOSET</Text>
        <Text style={styles.subtitle}>
          View and organize your wardrobe items here.
        </Text>

        {/* Three rendering states: loading, error, or content. */}
        {loading ? (
          <Text style={styles.statusText}>loading closet...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : (
          // Vertical list of section cards.
          <View style={styles.sections}>
            {/* One section card per key (tops, bottoms, etc.). */}
            {SECTION_KEYS.map((key) => {
              const sectionItems = itemsBySection[key] ?? [];

              return (
                <View key={key} style={styles.sectionCard}>

                  {/* Section title with item count. */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.cardTitle}>{toSectionTitle(key)}</Text>
                    {sectionItems.length > 0 && (
                      <Text style={styles.itemCount}>{sectionItems.length}</Text>
                    )}
                  </View>

                  {sectionItems.length === 0 ? (
                    // Empty state for sections with no matching items.
                    <Text style={styles.emptyText}>No items yet</Text>
                  ) : (
                    // Horizontal scroll — swipe to browse, no arrows on mobile.
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.itemsRow}
                    >
                      {sectionItems.map((item) => (
                        <ItemCard
                          key={item._id}
                          item={item}
                          onPress={() => setSelectedItem(item)}
                        />
                      ))}
                    </ScrollView>
                  )}

                </View>
              );
            })}
          </View>
        )}

        {/* Bottom padding so content clears the tab bar. */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom tab bar — home, add item, closet (active), settings. */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/dashboard")}>
          <MaterialCommunityIcons name="home-outline" size={24} color="#b0968e" />
        </TouchableOpacity>

        <UploadPlusButton />

        {/* Closet is the active screen. */}
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="hanger" size={24} color="#8A5F5F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/settings")}>
          <MaterialCommunityIcons name="tune-variant" size={24} color="#b0968e" />
        </TouchableOpacity>
      </View>

      {/* Shared modal component. It is visible whenever selectedItem is non-null. */}
      <ItemEditModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <UploadItemCard />

    </LinearGradient>
    </UploadProvider>
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
    marginBottom: 20,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  statusText: {
    color: "#8A5F5F",
    fontSize: 18,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  sections: {
    gap: 16,
  },

  sectionCard: {
    width: "100%",
    minHeight: 160,
    backgroundColor: "rgba(254, 253, 244, 0.6)",
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },

  // section title and item count sit side by side
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  cardTitle: {
    color: "#8A5F5F",
    fontSize: 22,
    fontFamily: "DMSerifDisplay_400Regular",
  },

  itemCount: {
    color: "#8A7A7A",
    fontSize: 13,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    marginTop: 4,
  },

  emptyText: {
    color: "#8A7A7A",
    fontSize: 14,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

  itemsRow: {
    gap: 12,
    paddingRight: 12,
  },

  // bottom tab bar — same structure as dashboard.tsx
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