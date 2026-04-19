import React, { useEffect, useState, useCallback, useMemo } from "react";
import {View,Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import GridOverlay from "../components/features/gridoverlay";
import ItemEditModal from "../components/features/itemEditModal";
import ItemCard from "../components/ui/ItemCard";
import { getToken } from "../utils/authStorage";
import { ClothingItem, SectionKey, SECTION_KEYS, typeToSectionKey } from "../components/features/labels";
import { getCloset } from "@/utils/getUserCloset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type UploadImage = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

function toSectionTitle(key: SectionKey): string {
  if (key === "onePieces") return "One Pieces";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// Main closet screen for mobile:
// 1) loads clothing items
// 2) groups them by section
// 3) renders horizontal carousels per section
// 4) opens the edit modal for updates/deletes
// 5) upload an image + analysis popup
export default function ClosetScreen() {

  // 1. INITIAL STATE

  const router = useRouter();

  // API data + page status.
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controls which item is open in ItemEditModal. null means modal closed.
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  // image upload + analysis state
  const [uploadedImage,      setUploadedImage]      = useState<string | null>(null);
  const [imageFile,          setImageFile]          = useState<UploadImage | null>(null);
  const [uploadedItem,       setUploadedItem]       = useState<any>(null);
  //const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [showPopup,          setShowPopup]          = useState(false);
  const [analysisText,       setAnalysisText]       = useState("");
  const [isUploading,        setIsUploading]        = useState(false);

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

  // opens the image picker and prepares the file for upload
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Allow photo access to upload.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        // resize to max 1000px wide before upload to avoid 413 errors
        const resized = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setUploadedImage(resized.uri);
        setImageFile({
          uri: resized.uri,
          name: "upload.jpg",
          type: "image/jpeg",
          file: (asset as { file?: Blob }).file,
        });

        // open the confirmation popup
        setShowPopup(true);
        setAnalysisText("");
        setUploadedItem(null);
        setIsUploading(false);

        console.log("Prepared image file:", { uri: asset.uri, name: "upload.jpg", type: "image/jpeg" });
      }
    } catch (error) {
      console.log("Image picker error:", error);
    }
  };

   // sends image to backend, sets analysis result text
   const uploadImage = async () => {
    try {
      setIsUploading(true);
      setAnalysisText("");

      const token = await getToken();
      if (!token || !imageFile) return;

      const formData = new FormData();

      // web needs a blob, native can use the uri directly
      if (Platform.OS === "web") {
        // always fetch from resized uri on web — ignore asset.file which is unresized
        const fileResponse = await fetch(imageFile.uri);
        const blob = await fileResponse.blob();
        formData.append("image", blob, imageFile.name);
      } else {
        formData.append("image", {
          uri: imageFile.uri,
          name: imageFile.name,
          type: imageFile.type,
        } as any);
      }

      const response = await fetch(`${API_URL}/api/clothing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadedItem(null);
        setAnalysisText("Upload failed");
        return;
      }

      const item =
  		data?.response?.item ||
  		data?.item ||
  		data?.clothingItem ||
  		null;

      setUploadedItem(item);

      const detectedText =
  		  item?.description ||
  		  item?.label ||
  		  item?.analysis ||
  		  item?.name ||
  		  data?.response?.message ||
  		  "Item uploaded successfully";

        setAnalysisText(detectedText);

      // refresh closet list so new item appears immediately
      const refreshed = await getCloset();
      if (Array.isArray(refreshed)) setItems(refreshed);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadedItem(null);
      setAnalysisText("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // resets all upload state and closes the popup
  const resetUpload = () => {
    setShowPopup(false);
    setUploadedImage(null);
    setImageFile(null);
    setUploadedItem(null);
    setIsUploading(false);
  };

return (
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

        {/* Plus opens image picker directly from closet. */}
        <TouchableOpacity style={styles.tabItem} onPress={handlePickImage}>
          <MaterialCommunityIcons name="plus-circle-outline" size={32} color="#b0968e" />
        </TouchableOpacity>

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

      {/* Upload popup — same logic as dashboard.tsx. */}
      {showPopup && (
        <View style={styles.popupOverlay}>
          <View
            style={[
              styles.popupCard,
              !isUploading && analysisText ? styles.popupCardResult : null,
            ]}
          >
            {/* Result state: show detected text above image. */}
            {uploadedItem ? (
  // RESULT STATE
  <>
    <View style={styles.popupResultTextBox}>
      <Text style={styles.popupResultTitle}>we detected:</Text>

      {uploadedItem?.type && (
        <Text style={styles.popupText}>
          Type: {uploadedItem.type}
        </Text>
      )}

      {uploadedItem?.subtype && (
        <Text style={styles.popupText}>
          Subtype: {uploadedItem.subtype.replace(/-/g, " ")}
        </Text>
      )}
    </View>

    <View style={styles.popupImageWrapper}>
      <Image source={{ uri: uploadedImage! }} style={styles.popupImage} />
    </View>

    <View style={styles.popupButtons}>
      <Pressable style={styles.confirmButton} onPress={resetUpload}>
        <Text style={styles.popupButtonText}>done</Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={resetUpload}>
        <Text style={styles.popupButtonText}>cancel</Text>
      </Pressable>
    </View>
  </>
) : isUploading ? (
  // LOADING STATE
  <>
    <View style={styles.popupImageWrapper}>
      <Image source={{ uri: uploadedImage! }} style={styles.popupImage} />

      <View style={styles.popupImageOverlay}>
        <ActivityIndicator size="large" color="#FEFDF4" />
      </View>
    </View>

    <Text style={styles.popupPlaceholderText}>analyzing...</Text>
  </>
) : (
  // BEFORE CONFIRM STATE
  <>
    <View style={styles.popupImageWrapper}>
      <Image source={{ uri: uploadedImage! }} style={styles.popupImage} />
    </View>

    <Text style={styles.popupPlaceholderText}>
      confirm to analyze this image
    </Text>

    <View style={styles.popupButtons}>
      <Pressable style={styles.confirmButton} onPress={uploadImage}>
        <Text style={styles.popupButtonText}>confirm</Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={resetUpload}>
        <Text style={styles.popupButtonText}>cancel</Text>
      </Pressable>
    </View>
  </>
)}
          </View>
        </View>
      )}

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

  // popup overlay
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupCard: {
    width: "88%",
    backgroundColor: "#FEFDF4",
    borderRadius: 30,
    padding: 24,
    gap: 16,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  popupCardResult: {
    justifyContent: "flex-start",
  },

  popupImageWrapper: {
    position: "relative",
    width: "100%",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },

  popupImage: {
    width: "100%",
    height: 260,
    borderRadius: 20,
    resizeMode: "cover",
  },

  popupImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  popupTextBox: {
    width: "100%",
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  popupResultTextBox: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  popupResultTitle: {
    color: "#8A5F5F",
    fontSize: 22,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },

  popupText: {
    color: "#4E4E4E",
    fontSize: 16,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },

  popupPlaceholderText: {
    color: "#8A5F5F",
    fontSize: 15,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    textAlign: "center",
  },

  popupButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  confirmButton: {
    backgroundColor: "#8A5F5F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
  },

  cancelButton: {
    backgroundColor: "#4E4E4E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
  },

  popupButtonText: {
    color: "#FEFDF4",
    fontSize: 14,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },

});