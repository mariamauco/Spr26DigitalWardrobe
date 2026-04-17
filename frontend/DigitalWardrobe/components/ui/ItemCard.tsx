import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { ClothingItem } from "../features/labels";

type ItemCardProps = {
	item: ClothingItem;
	onPress: () => void;
};

export default function ItemCard({ item, onPress }: ItemCardProps) {
	return (
		<TouchableOpacity style={styles.itemCard} onPress={onPress}>
			<Image source={{ uri: `https://digitalwardrobe.xyz${item.imagePath}` }} style={styles.itemImage} />
			<Text style={styles.itemName} numberOfLines={1}>
				{item.name}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
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
