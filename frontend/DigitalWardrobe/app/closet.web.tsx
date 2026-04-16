import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import ItemEditModal from "../components/features/itemEditModal";
import ItemCard from "../components/ui/ItemCard";
import { useUser } from "../components/features/userContext";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ClothingItem, SectionKey, SECTION_KEYS, typeToSectionKey} from "../components/features/labels";
import { getCloset } from "@/utils/getUserCloset";


function toSectionTitle(key: SectionKey): string {
  if (key === "onePieces") return "One Pieces";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// Main closet screen for web:
// 1) loads clothing items
// 2) groups them by section
// 3) renders horizontal carousels per section
// 4) opens the edit modal for updates/deletes
export default function ClosetScreen() {

  // 1. INITIAL STATE

  // User data is currently only used for the sidebar greeting.
  const { user } = useUser();

  // API data + page status.
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controls which item is open in ItemEditModal. null means modal closed.
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const sectionScrollRefs = useRef<Record<SectionKey, ScrollView | null>>({
    tops: null,
    bottoms: null,
    onePieces: null,
    outerwear: null,
    shoes: null,
    accessories: null,
    other: null,
  });

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

  const scrollSectionBy = useCallback((key: SectionKey, delta: number) => {
    const ref = sectionScrollRefs.current[key];
    const node = (ref as any)?.getScrollableNode?.() as HTMLElement | null;
    node?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return (
    // Overall page shell with gradient background and centered content area.
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      {/* Decorative background overlay grid. */}
      <GridOverlay />
      <View style={styles.contentWrapper}>
      {/* Persistent left navigation rail. */}
      <DashboardSidebar 
        activeScreen="closet" 
        username={user?.name || "User"}
        />

        {/* Main content column (title + states + section cards). */}
        <View style={styles.main}>
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
            <ScrollView
              contentContainerStyle={styles.sections}
              showsVerticalScrollIndicator={false}
            >
            {/* One section card per key (tops, bottoms, etc.). */}
            {SECTION_KEYS.map((key) => {
  const sectionItems = itemsBySection[key] ?? [];
  
  return (
    <View
      key={key}
      style={styles.sectionCard}
    >

      <Text style={styles.cardTitle}>{toSectionTitle(key)}</Text>
      {sectionItems.length === 0 ? (
        // Empty state for sections with no matching items.
        <Text style={styles.emptyText}>No items yet</Text>
      ) : (
        <View style={styles.itemsScrollerRow}>
          <TouchableOpacity
            style={styles.scrollArrow}
            onPress={() => scrollSectionBy(key, -180)}
          >
            <Text style={styles.scrollArrowText}>{"<"}</Text>
          </TouchableOpacity>
          <ScrollView
            ref={(ref) => {
              sectionScrollRefs.current[key] = ref;
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsRow}
          >
            {sectionItems.map((item) => {
              return (
                <ItemCard
                  key={item._id}
                  item={item}
                  onPress={() => setSelectedItem(item)}
                />
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={styles.scrollArrow}
            onPress={() => scrollSectionBy(key, 180)}
          >
            <Text style={styles.scrollArrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
})}
            </ScrollView>
          )}
        </View>
      </View>
      {/* Shared modal component. It is visible whenever selectedItem is non-null. */}
      <ItemEditModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
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

   itemsScrollerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
    scrollArrow: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArrowText: {
    fontSize: 30,
    color: "#8A5F5F",
    fontWeight: "bold",
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
    flexDirection: "row",
    gap: 16,
    paddingRight: 16,
  },
});