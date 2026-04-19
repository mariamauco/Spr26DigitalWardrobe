// when user opens in file picker, open card that loads until the data gets recognized :we detected this as a 
//blue longsleeve shirt([color][subtype]) with __ accurancy(accuracy is for later)

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Platform, ActivityIndicator } from "react-native";
import { getToken } from "../utils/authStorage";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import GalleryCarousel from "../components/ui/galleryCard";
import { ScrollView } from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Pressable, Alert } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type UploadImage = {
	uri: string;
	name: string;
	type: string;
	file?: Blob;
};

export default function DashboardScreen() {
	const [weather, setWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
	const [weatherError, setWeatherError] = useState<string | null>(null);
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<UploadImage | null>(null);
	const [uploadedItem, setUploadedItem] = useState<any>(null);
	const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const [analysisText, setAnalysisText] = useState("loading...");
	const [isUploading, setIsUploading] = useState(false);
  
	const { user, setUser } = useUser();	
	
	useEffect(() => {
		const loadDashboardData = async () => {
		  try {
			const token = await getToken();
			console.log("Dashboard token:", token);
	  
			if (!token) {
			  console.log("No token found");
			  return;
			}
			// authenticating user (make sure user is logged in when in dashboard)
			try{
				const userResponse = await fetch(`${API_URL}/api/auth/user`, {
					method: "GET",
					headers: {
					  Authorization: `Bearer ${token}`,
					  "Content-Type": "application/json",
					},
			});
			
			const userData = await userResponse.json();

			console.log("User status:", userResponse.status);
			console.log("User response:", userData);
	  
			  if (!userResponse.ok) {
				console.log("User backend error:", userData);
			  } else {
				setUser(userData);
			  }
			} catch (userErr) {
			  console.log("User fetch error:", userErr);
			}
	  
			// WEATHER FETCH
			try {
				setWeatherLoading(true);
				setWeatherError(null);
	  
				const weatherResponse = await fetch(`${API_URL}/api/weather`, {
				  method: "GET",
				  headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				  },
				});
	  
				const weatherData = await weatherResponse.json();
	  
				console.log("Weather status:", weatherResponse.status);
				console.log("Weather response:", weatherData);
	  
				if (!weatherResponse.ok) {
				  console.log("Weather backend error:", weatherData);
				  setWeather(null);
				  setWeatherError(
					weatherData?.message ||
					  weatherData?.error ||
					  "Unable to load weather"
				  );
				} else {
				  setWeather(weatherData);
				  setWeatherError(null);
				}
			  } catch (weatherErr) {
				console.log("Weather fetch error:", weatherErr);
				setWeather(null);
				setWeatherError("Network error while loading weather");
			  } finally {
				setWeatherLoading(false);
			  }
			} catch (err) {
			  console.log("Dashboard fetch error:", err);
			  setWeatherLoading(false);
			  setWeatherError("Something went wrong");
			}
		  };
	  
		  loadDashboardData();
		}, []);

		const handlePickImage = async () => {
			try {
			  const permission =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
		  
			  if (!permission.granted) {
				Alert.alert("Permission required", "Allow photo access to upload.");
				return;
			  }
		  
			  const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				aspect: [4,5],
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

				setShowPopup(true);
				setAnalysisText("");
				setUploadedItem(null);
				setHasStartedAnalysis(false);
				setIsUploading(false);
			  
				console.log("Prepared image file:", {
				  uri: asset.uri,
				  name: "upload.jpg",
				  type: "image/jpeg",
				});
			  }
		  
			} catch (error) {
			  console.log("Image picker error:", error);
			}
		  };
		  
		  const uploadImage = async () => {
  try {
    console.log("Starting upload...");
    setHasStartedAnalysis(true);
    setIsUploading(true);
    setAnalysisText("");

    const token = await getToken();
    if (!token || !imageFile) {
      console.log("Missing token or imageFile");
      return;
    }

    const formData = new FormData();

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
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log("Upload response status:", response.status);

    const data = await response.json();
    console.log("Upload response data:", data);

    if (!response.ok) {
      setUploadedItem(null);
      setAnalysisText(data?.message || "Upload failed");
      return;
    }

    const item =
  		data?.response?.item ||
  		data?.item ||
  		data?.clothingItem ||
  		null;

    console.log("Detected clothing item:", item);

    setUploadedItem(item);

    const detectedText =
  		item?.description ||
  		item?.label ||
  		item?.analysis ||
  		item?.name ||
  		data?.response?.message ||
  		"Item uploaded successfully";

    setAnalysisText(detectedText);
	console.log(item.description);
	console.log(item.label);
	console.log(item.name);
	console.log("Upload response data:", detectedText);

  } catch (error) {
    console.error("Upload error:", error);
    setUploadedItem(null);
    setAnalysisText("Upload failed");
  } finally {
    setIsUploading(false);
  }
  
};
const formatUploadedItemDetails = (item: any) => {
  if (!item) return [];

  return [
    item.name ? { label: "name", value: item.name } : null,
    item.type ? { label: "type", value: item.type } : null,
    item.subtype ? { label: "subtype", value: item.subtype } : null,
    item.color ? { label: "color", value: item.color } : null,
    item.colors?.length
      ? { label: "colors", value: item.colors.join(", ") }
      : null,
    item.tags?.length
      ? { label: "tags", value: item.tags.join(", ") }
      : null,
    item.description ? { label: "description", value: item.description } : null,
    item.accuracy !== undefined
      ? { label: "accuracy", value: `${item.accuracy}%` }
      : null,
  ].filter(Boolean);
};

const uploadedItemDetails = uploadedItem
  ? [
      uploadedItem.type
        ? { label: "Type", value: uploadedItem.type }
        : null,
      uploadedItem.subtype
        ? { label: "Subtype", value: uploadedItem.subtype.replace(/-/g, " ") }
        : null,
    ].filter(Boolean)
  : [];


  return (
	<LinearGradient
	  colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
	  style={styles.container}
	>
		<GridOverlay />
	  <View style={styles.contentWrapper}>
		<DashboardSidebar
			username={user?.name || "User"}
			activeScreen="dashboard"
			onLogout={() => {
			  console.log("Log out pressed");
		  }}
		/>
		<ScrollView
		style={styles.main}
		contentContainerStyle={{ paddingBottom: 40 }}
		showsVerticalScrollIndicator={false}
		>
		  <Text style={styles.greeting}>
			HELLO, {user?.name ? user.name.toUpperCase() : "USER"}!
		  </Text>

		<View style={styles.mainRow}>
		{/* Daily Outfit Card */}
		<View style={styles.dailyCard}>
			<Text style={styles.cardText}>daily outfit</Text>

			{/* img */}
			<View style={{ marginTop: 20 }}>
			<GalleryCarousel width={400} height={500} />
			</View>
		</View>

		<View style={styles.rightColumn}>
			{/* weather widget*/}
			<View style={styles.weatherCard}>
			{weather?.weather?.[0]?.icon ? (
				<Image
				source={{
					uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
				}}
				style={styles.weatherIcon}
				/>
			) : null}

			<Text style={styles.cardText}>
				{weather?.weather?.[0]?.main || "weather forecast"}
			</Text>

			{weatherLoading ? (
				<Text style={styles.weatherDescription}>
				loading weather...
				</Text>
			) : weatherError ? (
				<Text style={styles.weatherDescription}>
				{weatherError}
				</Text>
			) : weather?.weather?.[0]?.description ? (
				<Text style={styles.weatherDescription}>
				{weather.weather[0].description}
				</Text>
			) : (
				<Text style={styles.weatherDescription}>
				weather unavailable
				</Text>
			)}

			{weather?.main?.temp !== undefined ? (
				<Text style={styles.weatherTemp}>
				{Math.round(weather.main.temp)}°F
				</Text>
			) : null}
			</View>
			{/* upload widget*/}
			<Pressable
				style={styles.smallCard}
				onPress={!uploadedImage ? handlePickImage : undefined}
			>
				{uploadedImage ? (
					<>
						<Image source={{ uri: uploadedImage }} style={styles.uploadPreview} />
						<Pressable style={styles.testButton} onPress={uploadImage}>
							<Text style={styles.testButtonText}>test upload</Text>
						</Pressable>
					</>
				) : (
					<View style={styles.uploadContent}>
						<Text style={styles.uploadTitle}>add item</Text>
						<Text style={styles.uploadDescription}>upload a photo to your wardrobe
						</Text>

						<View style={styles.uploadButton}>
							<Text style={styles.uploadButtonText}>choose photo</Text>
						</View>
						  
					</View>
				)}
			</Pressable>
		</View>
		</View>
		</ScrollView>
	  </View>
		   {showPopup && (
  <View style={styles.popupOverlay}>
	<View
	  style={[
		styles.popupCard,
		!isUploading && analysisText ? styles.popupCardResult : null,
	  ]}
	>
	  {/* RESULT STATE: text + detected item data */}
	   {!isUploading && uploadedItem ? (
  <>
    <Text style={styles.popupResultTitle}>we detected:</Text>

    <View style={styles.popupImageOnlySection}>
      <View style={styles.popupImageWrapper}>
        <Image source={{ uri: uploadedImage! }} style={styles.popupImage} />
      </View>
    </View>

    <View style={styles.popupButtons}>
      <Pressable
        style={styles.confirmButton}
        onPress={() => {
          setShowPopup(false);
          setUploadedImage(null);
          setImageFile(null);
          setUploadedItem(null);
          setAnalysisText("");
          setHasStartedAnalysis(false);
        }}
      >
        <Text style={styles.popupButtonText}>done</Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => {
          setShowPopup(false);
          setUploadedImage(null);
          setImageFile(null);
          setUploadedItem(null);
          setAnalysisText("");
          setHasStartedAnalysis(false);
        }}
      >
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
    </View>
  </>
) : (
		<>
		  {/* BEFORE / DURING UPLOAD */}
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
			  <Text style={styles.popupPlaceholderText}>
				confirm to analyze this image
			  </Text>
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
			  <Text style={styles.popupButtonText}>
				{isUploading ? "loading..." : "confirm"}
			  </Text>
			</Pressable>

			<Pressable
			  style={styles.cancelButton}
			  onPress={() => {
				setShowPopup(false);
				setUploadedImage(null);
				setImageFile(null);
				setUploadedItem(null);
				setAnalysisText("");
				setHasStartedAnalysis(false);
				setIsUploading(false);
			  }}
			>
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
	paddingHorizontal: 16,
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

  weatherIcon: {
	width: 80,
	height: 80,
	marginBottom: 10,
  },

  weatherDescription: {
	color: "#8A5F5F",
	fontSize: 16,
	marginTop: 4,
	textTransform: "capitalize",
	textAlign: "center",
	fontFamily: "DMSerifDisplay_400Regular",
  },

  weatherTemp: {
	color: "#4E4E4E",
	fontSize: 20,
	marginTop: 6,
	fontFamily: "EncodeSansSemiCondensed_400Regular",
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
	width: "82%",
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
  },
  
popupCard: {
  width: 420,
  minHeight: 620,
  backgroundColor: "#FEFDF4",
  borderRadius: 30,
  padding: 24,
  gap: 18,
  alignItems: "center",
  justifyContent: "flex-start",
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

popupResultTextBox: {
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 12,
  marginBottom: 8,
},

popupResultTitle: {
  fontSize: 24,
  fontWeight: "700",
  color: "#8F6262",
  marginBottom: 8,
  textAlign: "center",
},

popupText: {
  color: "#4E4E4E",
  fontSize: 22,
  fontFamily: "EncodeSansSemiCondensed_400Regular",
  textAlign: "center",
  lineHeight: 24,
},

popupPlaceholderText: {
  color: "#8A5F5F",
  fontSize: 16,
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
popupDetailsBox: {
  width: "100%",
  backgroundColor: "rgba(138,95,95,0.08)",
  borderRadius: 18,
  paddingVertical: 14,
  paddingHorizontal: 16,
  gap: 8,
},

popupResultContent: {
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: 24,
  width: "100%",
  marginTop: 20,
},

popupRightContent: {
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "flex-start",
  maxWidth: 280,
},

popupMainDescription: {
  fontSize: 20,
  color: "#4B4B4B",
  marginBottom: 18,
  lineHeight: 28,
  fontWeight: "500",
},

popupDetailRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: 8,
  flexWrap: "wrap",
},

popupDetailRowCentered: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 10,
},

popupDetailLabel: {
  fontSize: 22,
  fontWeight: "700",
  color: "#8F6262",
  marginRight: 6,
},

popupDetailValue: {
  fontSize: 22,
  color: "#4B4B4B",
  textTransform: "capitalize",
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
	marginBottom: 4,
  },
  
  popupInfoLabel: {
	color: "#8A5F5F",
	fontFamily: "DMSerifDisplay_400Regular",
  },

});