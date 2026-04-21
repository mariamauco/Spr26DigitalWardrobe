import React, { createContext, useContext, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	Platform,
	ActivityIndicator,
	Pressable,
	Alert,
	ActionSheetIOS,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getToken } from "@/utils/authStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type UploadImage = {
	uri: string;
	name: string;
	type: string;
	file?: Blob;
};

type UploadContextValue = {
	uploadedImage: string | null;
	imageFile: UploadImage | null;
	uploadedItem: any;
	hasStartedAnalysis: boolean;
	showPopup: boolean;
	analysisText: string;
	isUploading: boolean;
	handlePickImage: () => Promise<void>;
	uploadImage: () => Promise<void>;
	resetUpload: () => void;
};

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploadContext() {
	const context = useContext(UploadContext);
	if (!context) {
		throw new Error("Upload components must be used inside UploadProvider");
	}
	return context;
}

function buildImageUrl(imagePath?: string | null) {
	if (!imagePath) return null;
	if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
	if (!API_URL) return imagePath;
	const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
	return `${base}${normalizedPath}`;
}

function normalizeConfidence(value: any) {
	if (value === undefined || value === null || value === "") return null;

	const num = Number(value);
	if (Number.isNaN(num)) return null;

	// if backend gives 0.82 -> 82
	// if backend gives 82 -> 82
	const percent = num <= 1 ? num * 100 : num;
	return Math.max(0, Math.min(100, percent));
}

function formatConfidence(value: any) {
	const percent = normalizeConfidence(value);
	if (percent === null) return null;
	return `${percent.toFixed(0)}%`;
}

function formatColors(value: any) {
	if (!value) return null;

	if (Array.isArray(value)) {
		if (!value.length) return null;
		return value.join(", ");
	}

	return String(value);
}

function ConfidenceWheel({ value }: { value: any }) {
	const percent = normalizeConfidence(value);

	if (percent === null) return null;

	const size = 78;
	const strokeWidth = 8;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = (percent / 100) * circumference;
	const dashOffset = circumference - progress;

	return (
		<View style={styles.confidenceWheelWrapper}>
			<Svg width={size} height={size}>
				<Circle
					stroke="#E8DED6"
					fill="none"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
				/>
				<Circle
					stroke="#8A5F5F"
					fill="none"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					strokeDasharray={`${circumference} ${circumference}`}
					strokeDashoffset={dashOffset}
					strokeLinecap="round"
					rotation="-90"
					origin={`${size / 2}, ${size / 2}`}
				/>
			</Svg>

			<View style={styles.confidenceWheelCenter}>
				<Text style={styles.confidenceWheelText}>{percent.toFixed(0)}%</Text>
			</View>
		</View>
	);
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<UploadImage | null>(null);
	const [uploadedItem, setUploadedItem] = useState<any>(null);
	const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const [analysisText, setAnalysisText] = useState("loading...");
	const [isUploading, setIsUploading] = useState(false);

	const resetUpload = () => {
		setShowPopup(false);
		setUploadedImage(null);
		setImageFile(null);
		setUploadedItem(null);
		setAnalysisText("");
		setHasStartedAnalysis(false);
		setIsUploading(false);
	};

	const isWeb = Platform.OS === "web";

	const handlePickImage = async () => {
		try {
			let choice: number | null = null;
			let result: ImagePicker.ImagePickerResult | null = null;

			if (!isWeb) {
				choice = await new Promise<number>((resolve) => {
					ActionSheetIOS.showActionSheetWithOptions(
						{
							options: ["Take Photo", "Choose from Library", "Cancel"],
							cancelButtonIndex: 2,
						},
						resolve
					);
				});
			}

			if (isWeb || choice === 1) {
				const libPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (!libPermission.granted) {
					Alert.alert("Permission required", "Allow photo access to upload.");
					return;
				}

				result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ["images"],
					allowsEditing: true,
					aspect: [4, 5],
					quality: 1,
				});
			} else if (choice === 0) {
				const camPermission = await ImagePicker.requestCameraPermissionsAsync();
				if (!camPermission.granted) {
					Alert.alert("Permission required", "Allow camera access to take a photo.");
					return;
				}

				result = await ImagePicker.launchCameraAsync({
					mediaTypes: ["images"],
					allowsEditing: true,
					aspect: [4, 5],
					quality: 1,
				});
			} else if (!isWeb && choice === 2) {
				return;
			}

			if (!result || result.canceled || !result.assets?.length) return;

			const asset = result.assets[0];
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
			setShowPopup(true);
			setAnalysisText("");
			setUploadedItem(null);
			setHasStartedAnalysis(false);
			setIsUploading(false);
		} catch (error) {
			console.log("Image picker error:", error);
			Alert.alert("Upload error", "Something went wrong while picking the image.");
		}
	};

	const uploadImage = async () => {
		try {
			setHasStartedAnalysis(true);
			setIsUploading(true);
			setAnalysisText("");

			const token = await getToken();
			if (!token || !imageFile) {
				setAnalysisText("Missing image or auth token");
				return;
			}

			const formData = new FormData();

			if (Platform.OS === "web") {
				const fileResponse = await fetch(imageFile.uri);
				const blob = await fileResponse.blob();
				formData.append("image", blob, imageFile.name);
			} else {
				formData.append(
					"image",
					{
						uri: imageFile.uri,
						name: imageFile.name,
						type: imageFile.type,
					} as any
				);
			}

			const response = await fetch(`${API_URL}/api/clothing`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				setUploadedItem(null);
				setAnalysisText(data?.message || "Upload failed");
				return;
			}

			const item = data?.response?.item || data?.item || data?.clothingItem || null;
			setUploadedItem(item);
			console.log("uploaded item returned from backend:", item);

			const detectedImageUrl = buildImageUrl(item?.imagePath);
			if (detectedImageUrl) setUploadedImage(detectedImageUrl);

			const detectedText =
				item?.description ||
				item?.label ||
				item?.analysis ||
				item?.name ||
				data?.response?.message ||
				"Item uploaded successfully";

			setAnalysisText(detectedText);
		} catch (error) {
			console.error("Upload error:", error);
			setUploadedItem(null);
			setAnalysisText("Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<UploadContext.Provider
			value={{
				uploadedImage,
				imageFile,
				uploadedItem,
				hasStartedAnalysis,
				showPopup,
				analysisText,
				isUploading,
				handlePickImage,
				uploadImage,
				resetUpload,
			}}
		>
			{children}
		</UploadContext.Provider>
	);
}

export function UploadCard() {
	const { uploadedImage, handlePickImage, uploadImage } = useUploadContext();

	return (
		<Pressable style={styles.smallCard} onPress={!uploadedImage ? handlePickImage : undefined}>
			{uploadedImage ? (
				<>
					<Image source={{ uri: uploadedImage }} style={styles.uploadPreview} />
					<Pressable style={styles.testButton} onPress={uploadImage}>
						<Text style={styles.testButtonText}>test upload</Text>
					</Pressable>
				</>
			) : (
				<View style={styles.uploadContent}>
					<Text style={styles.uploadTitle}>Add Item</Text>
					<Text style={styles.uploadDescription}>Upload an item to your wardrobe</Text>
					<View style={styles.uploadButton}>
						<Text style={styles.uploadButtonText}>Choose photo</Text>
					</View>
				</View>
			)}
		</Pressable>
	);
}

export function ItemCard() {
	const {
		uploadedImage,
		uploadedItem,
		hasStartedAnalysis,
		showPopup,
		isUploading,
		uploadImage,
		resetUpload,
	} = useUploadContext();

	const detectedColors = formatColors(uploadedItem?.colors);
	const detectedConfidenceText =
		formatConfidence(uploadedItem?.confidenceScore) ||
		formatConfidence(uploadedItem?.confidence) ||
		formatConfidence(uploadedItem?.typeConfidence);

	const detectedConfidenceValue =
		uploadedItem?.confidenceScore ??
		uploadedItem?.confidence ??
		uploadedItem?.typeConfidence ??
		null;

	if (!showPopup) return null;

	return (
		<View style={styles.popupOverlay}>
			<View style={[styles.popupCard, !isUploading && uploadedItem ? styles.popupCardResult : null]}>
				{!isUploading && uploadedItem ? (
					<>
						<Text style={styles.popupResultTitle}>we detected:</Text>

						<View style={styles.popupImageOnlySection}>
							<View style={styles.popupImageWrapper}>
								<Image source={{ uri: uploadedImage! }} style={styles.popupImage} />
							</View>
						</View>

						<View style={styles.popupButtons}>
							<Pressable style={styles.confirmButton} onPress={resetUpload}>
								<Text style={styles.popupButtonText}>done</Text>
							</Pressable>

							<Pressable style={styles.cancelButton} onPress={resetUpload}>
								<Text style={styles.popupButtonText}>cancel</Text>
							</Pressable>
						</View>

						<View style={styles.popupDetailsBelowButtons}>
							{uploadedItem.type ? (
								<Text style={styles.popupInfoText}>
									<Text style={styles.popupInfoLabel}>Type:</Text> {uploadedItem.type}
								</Text>
							) : null}

							{uploadedItem.subtype ? (
								<Text style={styles.popupInfoText}>
									<Text style={styles.popupInfoLabel}>Subtype:</Text>{" "}
									{uploadedItem.subtype.replace(/-/g, " ")}
								</Text>
							) : null}

							{detectedColors ? (
								<Text style={styles.popupInfoText}>
									<Text style={styles.popupInfoLabel}>Colors:</Text> {detectedColors}
								</Text>
							) : null}

							{detectedConfidenceText ? (
								<View style={styles.confidenceBlock}>
									<Text style={styles.popupInfoLabel}>Confidence</Text>
									<ConfidenceWheel value={detectedConfidenceValue} />
								</View>
							) : null}
						</View>
					</>
				) : (
					<>
						<View style={styles.popupImageWrapper}>
							<Image source={{ uri: uploadedImage! }} style={styles.popupImage} />
							{isUploading && (
								<View style={styles.popupImageOverlay}>
									<ActivityIndicator size="large" color="#FEFDF4" />
								</View>
							)}
						</View>

						<View style={styles.popupTextBox}>
							{!hasStartedAnalysis ? (
								<Text style={styles.popupPlaceholderText}>confirm to analyze this image</Text>
							) : (
								<Text style={styles.popupPlaceholderText}>analyzing...</Text>
							)}
						</View>

						<View style={styles.popupButtons}>
							<Pressable
								style={[styles.confirmButton, isUploading && { opacity: 0.6 }]}
								onPress={uploadImage}
								disabled={isUploading}
							>
								<Text style={styles.popupButtonText}>{isUploading ? "loading..." : "confirm"}</Text>
							</Pressable>

							<Pressable style={styles.cancelButton} onPress={resetUpload}>
								<Text style={styles.popupButtonText}>cancel</Text>
							</Pressable>
						</View>
					</>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	smallCard: {
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(254, 253, 244, 0.6)",
		borderRadius: 30,
		justifyContent: "center",
	},
	uploadContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	uploadTitle: {
		color: "#8A5F5F",
		fontSize: 24,
		fontFamily: "DMSerifDisplay_400Regular",
		textAlign: "center",
		marginBottom: 8,
	},
	uploadDescription: {
		color: "#8A5F5F",
		fontSize: 15,
		textAlign: "center",
		fontFamily: "EncodeSansSemiCondensed_400Regular",
		marginBottom: 22,
		opacity: 0.85,
	},
	uploadButton: {
		backgroundColor: "#8A5F5F",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 20,
		minWidth: 150,
		alignItems: "center",
	},
	uploadButtonText: {
		color: "#FEFDF4",
		fontSize: 16,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
		textTransform: "lowercase",
	},
	uploadPreview: {
		width: "80%",
		height: 170,
		borderRadius: 20,
		resizeMode: "cover",
		marginTop: 18,
		marginBottom: 18,
	},
	testButton: {
		marginTop: 10,
		backgroundColor: "#4E4E4E",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 14,
		alignItems: "center",
	},
	testButtonText: {
		color: "#FEFDF4",
		fontSize: 14,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
	popupOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 50,
	},
	popupCard: {
		minWidth: 380,
		minHeight: 620,
		backgroundColor: "#FEFDF4",
		borderRadius: 30,
		padding: 24,
		gap: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	popupCardResult: {
		justifyContent: "flex-start",
	},
	popupImageWrapper: {
		width: 260,
		height: 260,
		borderRadius: 24,
		overflow: "hidden",
		backgroundColor: "#F3F3F3",
		justifyContent: "center",
		alignItems: "center",
	},
	popupImageOnlySection: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 18,
		marginBottom: 22,
	},
	popupImage: {
		width: "100%",
		height: "100%",
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
		minHeight: 60,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 10,
	},
	popupPlaceholderText: {
		color: "#8A5F5F",
		fontSize: 16,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
		textAlign: "center",
	},
	popupResultTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#8F6262",
		marginBottom: 8,
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
		paddingHorizontal: 16,
		borderRadius: 16,
	},
	cancelButton: {
		backgroundColor: "#4E4E4E",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 16,
	},
	popupButtonText: {
		color: "#FEFDF4",
		fontSize: 14,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
	popupDetailsBelowButtons: {
		marginTop: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	popupInfoText: {
		color: "#4E4E4E",
		fontSize: 16,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
		textAlign: "center",
		marginBottom: 6,
	},
	popupInfoLabel: {
		color: "#8A5F5F",
		fontFamily: "DMSerifDisplay_400Regular",
		fontSize: 18,
	},
	confidenceBlock: {
		marginTop: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	confidenceWheelWrapper: {
		marginTop: 10,
		width: 78,
		height: 78,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	confidenceWheelCenter: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
	},
	confidenceWheelText: {
		color: "#4E4E4E",
		fontSize: 14,
		fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
});