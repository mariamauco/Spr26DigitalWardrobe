// MOBILE LAYOUT
// when user opens in file picker, open card that loads until the data gets recognized :we detected this as a 
//blue longsleeve shirt([color][subtype]) with __ accurancy(accuracy is for later)

import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Image, Platform, ActivityIndicator, ScrollView, Pressable, Alert, TouchableOpacity, } from "react-native";
import { getToken } from "../utils/authStorage";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type UploadImage = {
	uri: string;
	name: string;
	type: string;
	file?: Blob;
};

function weatherEmoji(main: string): string {
	const m = main?.toLowerCase();
	if (m?.includes("clear")) return "☀️";
	if (m?.includes("cloud")) return "☁️";
	if (m?.includes("rain"))  return "🌧️";
	if (m?.includes("snow"))  return "❄️";
	if (m?.includes("storm")) return "⛈️";
	return "🌤️";
  }

export default function DashboardScreen() {
	const { user, setUser } = useUser();
	const router = useRouter();
	
	// weather state
	const [weather, setWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
  	const [weatherError, setWeatherError] = useState<string | null>(null);
	
	// image upload + analysis state
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<UploadImage | null>(null);
	const [uploadedItem, setUploadedItem] = useState<any>(null);
	const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const [analysisText, setAnalysisText] = useState("loading...");
	const [isUploading, setIsUploading] = useState(false);
	const [closetStats, setClosetStats] = useState({ tops: 0, bottoms: 0, shoes: 0, total: 0 });
	
	useEffect(() => {
		const loadDashboardData = async () => {
		  try {
			const token = await getToken();
	  
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


			  try{
				const closetResponse = await fetch(`${API_URL}/api/clothing/`, {
					method: "GET",
					headers: {
					  Authorization: `Bearer ${token}`,
					  "Content-Type": "application/json",
					},
				  });
				  const closetData = await closetResponse.json();
		
				  if (closetResponse.ok && Array.isArray(closetData)) {
					const tops    = closetData.filter((i: any) => i.type?.toLowerCase() === "top").length;
					const bottoms = closetData.filter((i: any) => i.type?.toLowerCase() === "bottom").length;
					const shoes   = closetData.filter((i: any) => ["shoe", "shoes", "footwear"].includes(i.type?.toLowerCase())).length;
					setClosetStats({ tops, bottoms, shoes, total: closetData.length });
				  }
				} catch (closetErr) {
				  console.log("Closet stats fetch error:", closetErr);
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
			  
				setUploadedImage(asset.uri);
				setImageFile({
				  uri: asset.uri,
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
    			setHasStartedAnalysis(true);
    			setIsUploading(true);
    			setAnalysisText("");

    			const token = await getToken();
    			if (!token || !imageFile) return;

    			const formData = new FormData();

				if (Platform.OS === "web") {
					let blob = imageFile.file;
					if (!blob) {
					  const fileResponse = await fetch(imageFile.uri);
					  blob = await fileResponse.blob();
					}
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

    			setUploadedItem(data);

    			const detectedText =
      				data.description ||
      				data.label ||
      				data.analysis ||
     				 "Item uploaded successfully";

    			setAnalysisText(detectedText);
				try {
					const refreshResponse = await fetch(`${API_URL}/api/clothing/`, {
					  method: "GET",
					  headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					  },
					});
					const refreshData = await refreshResponse.json();
					if (refreshResponse.ok && Array.isArray(refreshData)) {
					  const tops    = refreshData.filter((i: any) => i.type?.toLowerCase() === "top").length;
					  const bottoms = refreshData.filter((i: any) => i.type?.toLowerCase() === "bottom").length;
					  const shoes   = refreshData.filter((i: any) => ["shoe", "shoes", "footwear"].includes(i.type?.toLowerCase())).length;
					  setClosetStats({ tops, bottoms, shoes, total: refreshData.length });
					}
				  } catch (refreshErr) {
					console.log("Stats refresh error:", refreshErr);
				  }
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
			setAnalysisText("");
			setHasStartedAnalysis(false);
			setIsUploading(false);
		};

  return (
    <LinearGradient
      colors={["#FDECEB", "rgba(246,242,223,0.90)"]}
      style={styles.container}
    >
      <GridOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* pushes content below the status bar */}
        <View style={styles.statusSpacer} />

        {/* ── Greeting row ── */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              HELLO, {user?.name ? user.name.toUpperCase() : "USER"}!
            </Text>
			<Text style={styles.greetingDate}>
				{new Date().toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"})}
			</Text>
          </View>

          {/* avatar circle with first initial */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        </View>

        {/* ── Stat pills — wire these to real closet data later ── */}
        <View style={styles.statRow}>
          {[
            { label: "tops",    value: String(closetStats.tops)    },
			{ label: "bottoms", value: String(closetStats.bottoms) },
			{ label: "shoes",   value: String(closetStats.shoes)   },
			{ label: "total",   value: String(closetStats.total)   },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, s.label === "total" && styles.statCardActive]}
            >
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={[styles.statLabel, s.label === "total" && styles.statLabelActive]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Daily outfit card ── */}
        {/* placeholder thumbs — swap in GalleryCarousel once adapted for mobile */}
        <View style={styles.dailyCard}>
          <Text style={styles.cardText}>Today's Outfit</Text>
        </View>

        {/* ── Weather card + Upload card ── */}
        <View style={styles.secondRow}>

          {/* weather widget */}
          <View style={styles.weatherCard}>
            {weather?.weather?.[0]?.icon ? (
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png` }}
                style={styles.weatherIcon}
              />
            ) : null}

            <Text style={styles.cardText}>
              {weather?.weather?.[0]?.main || "weather forecast"}
            </Text>

            {weatherLoading ? (
              <ActivityIndicator size="small" color="#8A5F5F" style={{ marginTop: 8 }} />
            ) : weatherError ? (
              <Text style={styles.weatherDescription}>{weatherError}</Text>
            ) : weather?.weather?.[0]?.description ? (
              <Text style={styles.weatherDescription}>
                {weather.weather[0].description}
              </Text>
            ) : (
              <Text style={styles.weatherDescription}>weather unavailable</Text>
            )}

            {weather?.main?.temp !== undefined ? (
              <Text style={styles.weatherTemp}>
                {Math.round(weather.main.temp)}°F
              </Text>
            ) : null}
          </View>

          {/* upload widget */}
          <Pressable style={styles.smallCard} onPress={handlePickImage}>
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>add item</Text>
              <Text style={styles.uploadDescription}>
                
              </Text>
              <View style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>choose photo</Text>
              </View>
            </View>
          </Pressable>

        </View>

        {/* bottom padding so content clears the tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom nav bar */}
      <View style={styles.tabBar}>

  		<TouchableOpacity style={styles.tabItem}>
    		<View style={styles.tabIconActive}>
			<MaterialCommunityIcons name="home-outline" size={24} color="#8A5F5F" />
    		</View>
  		</TouchableOpacity>

  		{/* plus symbol */}
  		<TouchableOpacity style={styles.tabItem} onPress={handlePickImage}>
				<MaterialCommunityIcons name="plus-circle-outline" size={32} color="#b0968e" />
  		</TouchableOpacity>

  		{/* Closet */}
  		<TouchableOpacity style={styles.tabItem} onPress={() => router.push("/closet")}>
		  <MaterialCommunityIcons name="hanger" size={24} color="#b0968e" />
  		</TouchableOpacity>

  		{/* Settings */}
  		<TouchableOpacity style={styles.tabItem} onPress={() => router.push("/settings")}>
		  <MaterialCommunityIcons name="tune-variant" size={24} color="#b0968e" />
  		</TouchableOpacity>

	</View>

      {/*  Upload confirmation popup */}
      {showPopup && (
        <View style={styles.popupOverlay}>
          <View
            style={[
              styles.popupCard,
              !isUploading && analysisText ? styles.popupCardResult : null,
            ]}
          >
            {/* show detected text above image */}
            {!isUploading && analysisText ? (
              <>
                <View style={styles.popupResultTextBox}>
                  <Text style={styles.popupResultTitle}>we detected:</Text>
                  <Text style={styles.popupText}>{analysisText}</Text>
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
            ) : (
              /* before.during upload: image first, then status text */
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


// ─── Styles ────────────────────────────────────────────────────────────────────

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
  
	// greeting
	greetingRow: {
	  flexDirection: "row",
	  justifyContent: "space-between",
	  alignItems: "flex-start",
	  marginBottom: 16,
	},
  
  
	greeting: {
	  fontSize: 30,
	  color: "#4E4E4E",
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	},

	greetingDate: {
		fontSize: 20,
		color: "#8A7A7A",
		fontFamily: "EncodeSansSemiCondensed_400Regular",
		marginBottom: 2,
	  },
  
	avatar: {
	  width: 44,
	  height: 44,
	  borderRadius: 22,
	  backgroundColor: "rgba(138,95,95,0.15)",
	  justifyContent: "center",
	  alignItems: "center",
	  marginTop: 4,
	},
  
	avatarText: {
	  fontSize: 18,
	  color: "#8A5F5F",
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
  
	// stat pills row
	statRow: {
	  flexDirection: "row",
	  gap: 8,
	  marginBottom: 16,
	},
  
	statCard: {
	  flex: 1,
	  backgroundColor: "rgba(254,253,244,0.8)",
	  borderRadius: 16,
	  paddingVertical: 10,
	  alignItems: "center",
	  borderWidth: 1,
	  borderColor: "rgba(138,95,95,0.1)",
	},
  
	statCardActive: {
	  backgroundColor: "rgba(138,95,95,0.12)",
	  borderColor: "rgba(138,95,95,0.2)",
	},
  
	statNum: {
	  fontSize: 20,
	  fontWeight: "500",
	  color: "#8A5F5F",
	  fontFamily: "DMSerifDisplay_400Regular",
	},
  
	statLabel: {
	  fontSize: 9,
	  color: "#8A7A7A",
	  marginTop: 2,
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
  
	statLabelActive: {
	  color: "#8A5F5F",
	},
  
	// daily outfit card
	dailyCard: {
	  backgroundColor: "rgba(254, 253, 244, 0.6)",
	  borderRadius: 30,
	  padding: 20,
	  alignItems: "center",
	  marginBottom: 14,
	  minHeight: 280,
	},
  
	cardText: {
	  color: "#8A5F5F",
	  fontSize: 24,
	  fontFamily: "DMSerifDisplay_400Regular",
	  textAlign: "center",
	},
  
	// formatting outfit column
	outfitItemCol: {
	  flexDirection: "column",
	  gap: 12,
	  justifyContent: "center",
	},
  

  
	// weather + upload side by side
	secondRow: {
	  flexDirection: "row",
	  gap: 14,
	  marginBottom: 14,
	},
  
	weatherCard: {
	  flex: 1,
	  backgroundColor: "rgba(254, 253, 244, 0.6)",
	  borderRadius: 30,
	  justifyContent: "center",
	  alignItems: "center",
	  paddingHorizontal: 12,
	  paddingVertical: 16,
	  minHeight: 180,
	},
  
	weatherIcon: {
	  width: 60,
	  height: 60,
	  marginBottom: 6,
	},
  
	weatherDescription: {
	  color: "#8A5F5F",
	  fontSize: 13,
	  marginTop: 4,
	  textTransform: "capitalize",
	  textAlign: "center",
	  fontFamily: "DMSerifDisplay_400Regular",
	},
  
	weatherTemp: {
	  color: "#4E4E4E",
	  fontSize: 18,
	  marginTop: 6,
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
  
	// upload card
	smallCard: {
	  flex: 1,
	  backgroundColor: "rgba(254, 253, 244, 0.6)",
	  borderRadius: 30,
	  minHeight: 180,
	},
  
	uploadContent: {
	  flex: 1,
	  justifyContent: "center",
	  alignItems: "center",
	  paddingHorizontal: 14,
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
	  fontSize: 12,
	  textAlign: "center",
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	  marginBottom: 16,
	  opacity: 0.85,
	  lineHeight: 17,
	},
  
	uploadButton: {
	  backgroundColor: "#8A5F5F",
	  paddingVertical: 10,
	  paddingHorizontal: 18,
	  borderRadius: 20,
	  alignItems: "center",
	},
  
	uploadButtonText: {
	  color: "#FEFDF4",
	  fontSize: 13,
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	  textTransform: "lowercase",
	},
  
	// bottom tab bar
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
	  gap: 3,
	},
  
	tabLabel: {
	  fontSize: 10,
	  color: "#b0968e",
	  fontFamily: "EncodeSansSemiCondensed_400Regular",
	},
  
	tabLabelActive: {
	  color: "#8A5F5F",
	},
  
	tabIcon: {
	  fontSize: 20,
	},
  
	tabIconActive: {
	  width: 28,
	  height: 28,
	  borderRadius: 8,
	  backgroundColor: "rgba(138,95,95,0.15)",
	  justifyContent: "center",
	  alignItems: "center",
	},
  
	tabIconActiveTxt: {
	  fontSize: 16,
	  color: "#8A5F5F",
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