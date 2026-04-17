import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Modal, Pressable, Alert, TouchableOpacity, TextInput } from "react-native";
import { getToken } from "../../utils/authStorage";
import { ClothingItem, CLOTHING_TYPES, SUBTYPES, COLORS, TAGS } from "./labels";

// Backend base URL used for save/delete requests.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type ItemEditModalProps = {
	item: ClothingItem | null;
	onClose: () => void;
	onSave: (updated: ClothingItem) => void;
	onDelete: (id: string) => void;
};

export default function ItemEditModal({ item, onClose, onSave, onDelete }: ItemEditModalProps) {
  // Local form state mirrors the currently selected item.
  // This lets users edit values in the modal before saving.
	const [editName, setEditName] = useState("");
	const [editType, setEditType] = useState("");
	const [editSubtype, setEditSubtype] = useState("");
	const [editColors, setEditColors] = useState<string[]>([]);
	const [editTags, setEditTags] = useState<string[]>([]);

  // Request/loading state for action buttons.
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);

  // Dropdown visibility state.
	const [showTypeDD, setShowTypeDD] = useState(false);
	const [showSubDD, setShowSubDD] = useState(false);

	// Whenever a new item is opened, reset form fields and dropdown UI.
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

	// If no item is selected, keep modal unmounted.
	if (!item) return null;

	// Subtype list depends on selected type.
	const subtypeOpts = SUBTYPES[editType] ?? [];

	// Toggle chip selection for colors.
	const toggleColor = (c: string) =>
		setEditColors((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

	// Toggle chip selection for style tags.
	const toggleTag = (t: string) =>
		setEditTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

	// Persist edited fields to backend, then notify parent list via onSave.
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
				body: JSON.stringify({
					name: editName,
					type: editType.toLowerCase(),
					subtype: editSubtype.toLowerCase(),
					colors: editColors,
					tags: editTags,
				}),
			});

			const data = await res.json();
			if (res.ok) {
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

	// Confirm and delete item from backend, then remove it from parent list.
	const handleDelete = () => {
		const doDelete = async () => {
			setDeleting(true);
			try {
				const token = await getToken();
				const res = await fetch(`${API_URL}/api/clothing/${item._id}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				});

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
		// Click outside closes modal; click inside card is prevented from bubbling.
		<Modal transparent animationType="fade" visible onRequestClose={onClose}>
			<Pressable style={styles.overlay} onPress={onClose}>
				<Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
					{/* Scroll body keeps long forms usable on smaller viewports. */}
					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
						{/* Header: editable name + close button. */}
						<View style={styles.header}>
							<TextInput
								style={styles.titleInput}
								value={editName}
								onChangeText={setEditName}
								placeholder="Item name"
								placeholderTextColor="#C4AEA0"
							/>
							<TouchableOpacity onPress={onClose} style={styles.closeBtn}>
								<Text style={styles.closeTxt}>✕</Text>
							</TouchableOpacity>
						</View>

						{/* Garment image preview. */}
						<Image
							source={{ uri: `https://digitalwardrobe.xyz${item.imagePath}` }}
							style={styles.image}
							resizeMode="contain"
						/>

						{/* Type dropdown controls which subtype options appear. */}
						<Text style={styles.label}>Type</Text>
						<TouchableOpacity
							style={styles.dropBtn}
							onPress={() => {
								setShowTypeDD((v) => !v);
								setShowSubDD(false);
							}}
						>
							<Text style={styles.dropBtnTxt}>{editType || "Select type..."}</Text>
							<Text style={styles.arrow}>▾</Text>
						</TouchableOpacity>
						{showTypeDD && (
							<View style={styles.dropList}>
								{CLOTHING_TYPES.map((t) => (
									<TouchableOpacity
										key={t}
										style={[styles.dropItem, editType === t && styles.dropItemSel]}
										onPress={() => {
											setEditType(t);
											setEditSubtype("");
											setShowTypeDD(false);
										}}
									>
										<Text style={[styles.dropItemTxt, editType === t && styles.dropItemSelTxt]}>{t}</Text>
									</TouchableOpacity>
								))}
							</View>
						)}

						{/* Subtype is shown only when current type has defined subtypes. */}
						{subtypeOpts.length > 0 && (
							<>
								<Text style={styles.label}>Subtype</Text>
								<TouchableOpacity
									style={styles.dropBtn}
									onPress={() => {
										setShowSubDD((v) => !v);
										setShowTypeDD(false);
									}}
								>
									<Text style={styles.dropBtnTxt}>{editSubtype || "Select subtype..."}</Text>
									<Text style={styles.arrow}>▾</Text>
								</TouchableOpacity>
								{showSubDD && (
									<View style={styles.dropList}>
										{subtypeOpts.map((s) => (
											<TouchableOpacity
												key={s}
												style={[styles.dropItem, editSubtype === s && styles.dropItemSel]}
												onPress={() => {
													setEditSubtype(s);
													setShowSubDD(false);
												}}
											>
												<Text style={[styles.dropItemTxt, editSubtype === s && styles.dropItemSelTxt]}>{s}</Text>
											</TouchableOpacity>
										))}
									</View>
								)}
							</>
						)}

						{/* Multi-select chips for colors. */}
						<Text style={styles.label}>Colors</Text>
						<View style={styles.chips}>
							{COLORS.map((c) => (
								<TouchableOpacity
									key={c}
									style={[styles.chip, editColors.includes(c) && styles.chipSel]}
									onPress={() => toggleColor(c)}
								>
									<Text style={[styles.chipTxt, editColors.includes(c) && styles.chipSelTxt]}>{c}</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Multi-select chips for style tags. */}
						<Text style={styles.label}>Style Tags</Text>
						<View style={styles.chips}>
							{TAGS.map((t) => (
								<TouchableOpacity
									key={t}
									style={[styles.chip, editTags.includes(t) && styles.chipSel]}
									onPress={() => toggleTag(t)}
								>
									<Text style={[styles.chipTxt, editTags.includes(t) && styles.chipSelTxt]}>{t}</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Action row: destructive delete + primary save. */}
						<View style={styles.actions}>
							<TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
								<Text style={styles.deleteBtnTxt}>{deleting ? "Deleting..." : "Delete"}</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
								<Text style={styles.saveBtnTxt}>{saving ? "Saving..." : "Save Changes"}</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
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
