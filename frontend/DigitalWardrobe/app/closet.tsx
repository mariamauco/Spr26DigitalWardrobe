import React, { useEffect, useMemo, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import { getToken } from "../app/authStorage";
import { useUser } from "../components/features/userContext";
import { View, Text, StyleSheet, Image, ScrollView, Modal, Pressable, Alert, TouchableOpacity, TextInput } from "react-native";

type ClothingItem = {
  _id: string;
  user: string;
  name: string;
  type: string;
  subtype?: string;
  colors?: string[];
  tags?: string[];
  imagePath: string;
  createdAt?: string;
  updatedAt?: string;
};

const CLOTHING_TYPES = ["Top", "Bottom", "One Piece", "Outerwear", "Shoe", "Accessory"];

const SUBTYPES: Record<string, string[]> = {
  Top:          ["T-Shirt", "Long Sleeve Shirt", "Blouse", "Tank Top", "Sweater"],
  Bottom:       ["Jeans", "Trousers", "Pants", "Leggings", "Sweatpants", "Shorts", "Skirt"],
  "One Piece":  ["Dress", "Jumpsuit", "Romper", "Overalls", "Bodysuit"],
  Outerwear:    ["Jacket", "Coat", "Blazer", "Cardigan", "Vest", "Trench Coat"],
  Shoe:         ["Sneakers", "Boots", "Loafers", "Flats", "Heels", "Sandals"],
  Accessory:    ["Handbag", "Backpack", "Belt", "Hat", "Scarf", "Jewelry", "Sunglasses"],
};


const COLORS = [
  "black", "white", "gray", "red", "blue", "green", "yellow",
  "orange", "purple", "pink", "brown", "beige", "navy", "maroon", "teal", "cream",
];

const TAGS = [
  "casual", "formal", "business", "sporty", "streetwear", "vintage",
  "bohemian", "minimalist", "summer", "winter", "spring", "fall",
  "party", "beach", "outdoor", "loungewear",
];

type SectionKey = "tops" | "bottoms" | "onePieces" | "outerwear" | "shoes" | "accessories" | "other";

const SECTION_LABELS: Record<SectionKey, string> = {
  tops: "Tops", bottoms: "Bottoms", onePieces: "One Pieces",
  outerwear: "Outerwear", shoes: "Shoes", accessories: "Accessories", other: "Other",
};


function getItemSection(item: ClothingItem): SectionKey {
  const t = item.type?.toLowerCase();
  if (t === "top") return "tops";
  if (t === "bottom") return "bottoms";
  if (t === "one piece" || t === "one_piece" || t === "one-piece" || t === "dress") return "onePieces";
  if (t === "outerwear") return "outerwear";
  if (t === "shoe" || t === "shoes" || t === "footwear") return "shoes";
  if (t === "accessory" || t === "accessories") return "accessories";
  return "other";
}


const DraggablePressable = Pressable as any;
const DroppableView = View as any;

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function ItemEditModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: ClothingItem | null;
  onClose: () => void;
  onSave: (updated: ClothingItem) => void;
  onDelete: (id: string) => void;
}) {
  const [editName,    setEditName]    = useState("");
  const [editType,    setEditType]    = useState("");
  const [editSubtype, setEditSubtype] = useState("");
  const [editColors,  setEditColors]  = useState<string[]>([]);
  const [editTags,    setEditTags]    = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showTypeDD,  setShowTypeDD]  = useState(false);
  const [showSubDD,   setShowSubDD]   = useState(false);

  useEffect(() => {
    if (item) {
      setEditName(item.name ?? "");
      setEditType(item.type ?? "");
      setEditSubtype(item.subtype ?? "");
      setEditColors(item.colors ?? []);
      setEditTags(item.tags ?? []);
      setShowTypeDD(false);
      setShowSubDD(false);
    }
  }, [item?._id]);
 
  if (!item) return null;
 
  const subtypeOpts = SUBTYPES[editType] ?? [];
 
  const toggleColor = (c: string) =>
    setEditColors((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
 
  const toggleTag = (t: string) =>
    setEditTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
 
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/clothing/${item._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editName, type: editType, subtype: editSubtype, colors: editColors, tags: editTags }),
      });
      
      console.log(editName, editType, editSubtype, editColors, editTags)

      const data = await res.json();
      if (res.ok) {
        console.log()
        onSave(data);
        onClose();
      } else {
        Alert.alert("Error", data?.message ?? "Could not save changes");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };
 
  const handleDelete = () => {
    const doDelete = async () => {
      setDeleting(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/clothing/${item._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("delete status:", res.status, res.ok);
        if (res.ok) {
          onDelete(item._id);
          onClose();
        } else {
          const d = await res.json().catch(() => ({}));
          window.alert(d?.message ?? "Could not delete");
        }
      } catch {
        window.alert("Network error");
      } finally {
        setDeleting(false);
      }
    };
  
    if (window.confirm(`Remove "${item.name}" from your closet?`)) {
      doDelete();
    }
  };
  
 
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
 
            {/* ── Header ── */}
            <View style={mStyles.header}>
              <TextInput
                style={mStyles.titleInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Item name"
                placeholderTextColor="#C4AEA0"
              />
              <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
                <Text style={mStyles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
 
            {/* ── Image ── */}
            <Image
              source={{ uri: `https://digitalwardrobe.xyz${item.imagePath}` }}
              style={mStyles.image}
              resizeMode="contain"
            />
 
            {/* ── Type ── */}
            <Text style={mStyles.label}>Type</Text>
            <TouchableOpacity
              style={mStyles.dropBtn}
              onPress={() => { setShowTypeDD((v) => !v); setShowSubDD(false); }}
            >
              <Text style={mStyles.dropBtnTxt}>{editType || "Select type…"}</Text>
              <Text style={mStyles.arrow}>▾</Text>
            </TouchableOpacity>
            {showTypeDD && (
              <View style={mStyles.dropList}>
                {CLOTHING_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[mStyles.dropItem, editType === t && mStyles.dropItemSel]}
                    onPress={() => { setEditType(t); setEditSubtype(""); setShowTypeDD(false); }}
                  >
                    <Text style={[mStyles.dropItemTxt, editType === t && mStyles.dropItemSelTxt]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
 
            {/* ── Subtype ── */}
            {subtypeOpts.length > 0 && (
              <>
                <Text style={mStyles.label}>Subtype</Text>
                <TouchableOpacity
                  style={mStyles.dropBtn}
                  onPress={() => { setShowSubDD((v) => !v); setShowTypeDD(false); }}
                >
                  <Text style={mStyles.dropBtnTxt}>{editSubtype || "Select subtype…"}</Text>
                  <Text style={mStyles.arrow}>▾</Text>
                </TouchableOpacity>
                {showSubDD && (
                  <View style={mStyles.dropList}>
                    {subtypeOpts.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[mStyles.dropItem, editSubtype === s && mStyles.dropItemSel]}
                        onPress={() => { setEditSubtype(s); setShowSubDD(false); }}
                      >
                        <Text style={[mStyles.dropItemTxt, editSubtype === s && mStyles.dropItemSelTxt]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
 
            {/* ── Colors ── */}
            <Text style={mStyles.label}>Colors</Text>
            <View style={mStyles.chips}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[mStyles.chip, editColors.includes(c) && mStyles.chipSel]}
                  onPress={() => toggleColor(c)}
                >
                  <Text style={[mStyles.chipTxt, editColors.includes(c) && mStyles.chipSelTxt]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
 
            {/* ── Style Tags ── */}
            <Text style={mStyles.label}>Style Tags</Text>
            <View style={mStyles.chips}>
              {TAGS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[mStyles.chip, editTags.includes(t) && mStyles.chipSel]}
                  onPress={() => toggleTag(t)}
                >
                  <Text style={[mStyles.chipTxt, editTags.includes(t) && mStyles.chipSelTxt]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
 
            {/* ── Actions ── */}
            <View style={mStyles.actions}>
              <TouchableOpacity style={mStyles.deleteBtn} onPress={handleDelete} disabled={deleting}>
                <Text style={mStyles.deleteBtnTxt}>{deleting ? "Deleting…" : "🗑  Delete"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mStyles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={mStyles.saveBtnTxt}>{saving ? "Saving…" : "Save Changes"}</Text>
              </TouchableOpacity>
            </View>
 
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ClosetScreen() {

  const { user } = useUser();

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [sectionOrders, setSectionOrders] = useState<Record<SectionKey, string[]>>({ tops: [], bottoms: [], onePieces: [], outerwear: [], shoes: [], accessories: [], other: [] });
  const [dragId, setDragId] = useState<string | null>(null);
  
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

        const loaded: ClothingItem[] = Array.isArray(data) ? data : [];
        setItems(loaded);

        const orders: Record<SectionKey, string[]> = { 
          tops: [], bottoms: [], onePieces: [], outerwear: [], shoes: [], accessories: [], other: [] };
        loaded.forEach((item) => orders[getItemSection(item)].push(item._id));
        setSectionOrders(orders);
      } catch (err) {
        console.log("Closet fetch error:", err);
        setError("Network error while loading closet");
      } finally {
        setLoading(false);
      }
    };

    loadCloset();
  }, []);

  const handleDragOver = useCallback((sectionKey: SectionKey, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setSectionOrders((prev) => {
      const section = [...(prev[sectionKey] ?? [])];
      const fromIdx = section.indexOf(dragId);
      const toIdx   = section.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      section.splice(fromIdx, 1);
      section.splice(toIdx, 0, dragId);
      return { ...prev, [sectionKey]: section };
    });
  }, [dragId]);

  const sectionTypeMap: Record<SectionKey, string> = {
    tops: "top", bottoms: "bottom", onePieces: "one_piece",
    outerwear: "outerwear", shoes: "shoe", accessories: "accessory", other: "other",
  };
  
  const handleDropOnSection = useCallback((targetSection: SectionKey, e: any) => {
    e?.preventDefault?.();
    if (!dragId) return;
    setSectionOrders((prev) => {
      const next = { ...prev };
      (Object.keys(next) as SectionKey[]).forEach((k) => {
        next[k] = next[k].filter((id) => id !== dragId);
      });
      next[targetSection] = [...next[targetSection], dragId];
      return next;
    });
    setItems((prev) =>
      prev.map((i) => i._id === dragId ? { ...i, type: sectionTypeMap[targetSection] } : i)
    );
    setDragId(null);
  }, [dragId]);
  
  
  const handleSave = useCallback((updated: ClothingItem) => {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    setSectionOrders((prev) => {
      const next = { ...prev };
      (Object.keys(next) as SectionKey[]).forEach((k) => {
        next[k] = next[k].filter((id) => id !== updated._id);
      });
      next[getItemSection(updated)] = [...next[getItemSection(updated)], updated._id];
      return next;
    });
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    setSectionOrders((prev) => {
      const next = { ...prev };
      (Object.keys(next) as SectionKey[]).forEach((k) => { next[k] = next[k].filter((x) => x !== id); });
      return next;
    });
  }, []);
  
  const itemMap = useMemo(() => {
    const m: Record<string, ClothingItem> = {};
    items.forEach((i) => { m[i._id] = i; });
    return m;
  }, [items]);
  
  const getOrderedItems = (key: SectionKey): ClothingItem[] =>
    sectionOrders[key].map((id) => itemMap[id]).filter(Boolean) as ClothingItem[];
  
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
            {(["tops", "bottoms", "onePieces", "outerwear", "shoes", "accessories", "other"] as SectionKey[]).map((key) => {
  const sectionItems = getOrderedItems(key);
  return (
    <DroppableView
      key={key}
      style={[styles.sectionCard, dragId && styles.sectionDropTarget]}
      onDragOver={(e: any) => e?.preventDefault?.()}
      onDrop={(e: any) => handleDropOnSection(key, e)}
    >

      <Text style={styles.cardTitle}>{SECTION_LABELS[key]}</Text>
      {sectionItems.length === 0 ? (
        <Text style={styles.emptyText}>No items yet</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsRow} scrollEnabled={!dragId}>
          {sectionItems.map((item) => {
            const isDragging = dragId === item._id;
            return (
              <DraggablePressable
                key={item._id}
                style={[styles.itemCard, isDragging && styles.itemDragging, !!dragId && !isDragging && styles.itemDropZone]}
                onPress={() => {
                  if (dragId) {
                    if (dragId !== item._id) handleDragOver(key, item._id);
                    setDragId(null);
                  } else {
                    setSelectedItem(item);
                  }
                }}
                onLongPress={() => setDragId(item._id)}
                draggable
                onDragStart={() => setDragId(item._id)}
                onDragOver={(e: any) => { e?.preventDefault?.(); handleDragOver(key, item._id); }}
                onDrop={(e: any) => { e?.preventDefault?.(); setDragId(null); }}
                onDragEnd={() => setDragId(null)}
              >
                <Image source={{ uri: `https://digitalwardrobe.xyz${item.imagePath}` }} style={[styles.itemImage, isDragging && { opacity: 0.4 }]} />
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {isDragging && <Text style={styles.draggingBadge}>moving</Text>}
              </DraggablePressable>
            );
          })}
        </ScrollView>
      )}
      {dragId && itemMap[dragId] && getItemSection(itemMap[dragId]) === key && (
        <Text style={styles.dragHint}>Tap another item to reorder · tap same item to cancel</Text>
      )}
    </DroppableView>
  );
})}
            </ScrollView>
          )}
        </View>
      </View>
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
  draggingBadge: {
    marginTop: 4,
    fontSize: 10,
    color: "#8A5F5F",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    fontStyle: "italic",
  },
  dragHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#8A7A7A",
    fontStyle: "italic",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
  itemDragging: {
    opacity: 0.45,
    transform: [{ scale: 0.93 }],
  },
  itemDropZone: {
    borderWidth: 1.5,
    borderColor: "rgba(138, 95, 95, 0.45)",
    borderRadius: 18,
  },
  sectionDropTarget: {
    borderWidth: 2,
    borderColor: "rgba(138, 95, 95, 0.4)",
    borderStyle: "dashed",
  },
  
});
const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(78, 60, 58, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: "#FEFDF4",
    borderRadius: 28,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: "DMSerifDisplay_400Regular",
    color: "#4E4E4E",
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "DMSerifDisplay_400Regular",
    color: "#4E4E4E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 95, 95, 0.3)",
    paddingVertical: 2,
    marginRight: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(138, 95, 95, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTxt: { fontSize: 14, color: "#8A5F5F" },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "rgba(245, 237, 237, 0.4)",
    marginBottom: 20,
  },
 
  label: {
    fontSize: 11,
    color: "#8A5F5F",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
    marginBottom: 8,
    marginTop: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
 
  dropBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(245, 237, 237, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(138, 95, 95, 0.2)",
  },
  dropBtnTxt: {
    fontSize: 15,
    color: "#4E4E4E",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
  arrow: { fontSize: 14, color: "#8A5F5F" },
 
  dropList: {
    backgroundColor: "#FEFDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(138, 95, 95, 0.2)",
    marginTop: 4,
    overflow: "hidden",
    zIndex: 999,
  },
  dropItem: { paddingHorizontal: 16, paddingVertical: 10 },
  dropItemSel: { backgroundColor: "rgba(138, 95, 95, 0.12)" },
  dropItemTxt: {
    fontSize: 15,
    color: "#4E4E4E",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
  dropItemSelTxt: { color: "#8A5F5F", fontWeight: "600" },
 
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(245, 237, 237, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(138, 95, 95, 0.2)",
  },
  chipSel: {
    backgroundColor: "rgba(138, 95, 95, 0.18)",
    borderColor: "#8A5F5F",
  },
  chipTxt: {
    fontSize: 13,
    color: "#8A7A7A",
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
  chipSelTxt: { color: "#8A5F5F" },
 
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(200, 80, 80, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(200, 80, 80, 0.3)",
    alignItems: "center",
  },
  deleteBtnTxt: {
    color: "#C84040",
    fontSize: 15,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#8A5F5F",
    alignItems: "center",
  },
  saveBtnTxt: {
    color: "#FEFDF4",
    fontSize: 15,
    fontFamily: "EncodeSansSemiCondensed_400Regular",
  },
});
 