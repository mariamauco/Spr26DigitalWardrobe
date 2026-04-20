import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getToken } from "../utils/authStorage";
import { useUser } from "../components/features/userContext";
import GridOverlay from "../components/features/gridoverlay";
import { UploadProvider, UploadCard, ItemCard, useUploadContext } from "../components/features/uploadItem";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type ClosetStats = {
	tops: number;
	bottoms: number;
	shoes: number;
	total: number;
};

function UploadPlusButton() {
	const { handlePickImage } = useUploadContext();

	return (
		<TouchableOpacity style={styles.tabItem} onPress={handlePickImage}>
			<MaterialCommunityIcons name="plus-circle-outline" size={32} color="#b0968e" />
		</TouchableOpacity>
	);
}
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
	const router = useRouter();
	const { user, setUser } = useUser();
	const [weather, setWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
	const [weatherError, setWeatherError] = useState<string | null>(null);
	const [closetStats, setClosetStats] = useState<ClosetStats>({ tops: 0, bottoms: 0, shoes: 0, total: 0 });

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				const token = await getToken();
				if (!token) return;

				try {
					const userResponse = await fetch(`${API_URL}/api/auth/user`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					});

					if (userResponse.ok) setUser(await userResponse.json());
				} catch (userErr) {
					console.log("User fetch error:", userErr);
				}

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
					if (!weatherResponse.ok) {
						setWeather(null);
						setWeatherError(weatherData?.message || weatherData?.error || "Unable to load weather");
					} else {
						setWeather(weatherData);
					}
				} catch (weatherErr) {
					console.log("Weather fetch error:", weatherErr);
					setWeather(null);
					setWeatherError("Network error while loading weather");
				} finally {
					setWeatherLoading(false);
				}

				try {
					const closetResponse = await fetch(`${API_URL}/api/clothing/`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					});
					const closetData = await closetResponse.json();
					if (closetResponse.ok && Array.isArray(closetData)) {
						const tops = closetData.filter((item: any) => item.type?.toLowerCase() === "top").length;
						const bottoms = closetData.filter((item: any) => item.type?.toLowerCase() === "bottom").length;
						const shoes = closetData.filter((item: any) => ["shoe", "shoes", "footwear"].includes(item.type?.toLowerCase())).length;
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
	}, [setUser]);

	return (
		<UploadProvider>
			<LinearGradient colors={["#FDECEB", "rgba(246,242,223,0.90)"]} style={styles.container}>
				<GridOverlay />

				<ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.statusSpacer} />

					<View style={styles.greetingRow}>
						<View>
							<Text style={styles.greeting}>HELLO, {user?.name ? user.name.toUpperCase() : "USER"}!</Text>
							<Text style={styles.greetingDate}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
						</View>

						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</Text>
						</View>
					</View>

					<View style={styles.statRow}>
						{[
							{ label: "tops", value: String(closetStats.tops) },
							{ label: "bottoms", value: String(closetStats.bottoms) },
							{ label: "shoes", value: String(closetStats.shoes) },
							{ label: "total", value: String(closetStats.total) },
						].map((stat) => (
							<View key={stat.label} style={[styles.statCard, stat.label === "total" && styles.statCardActive]}>
								<Text style={styles.statNum}>{stat.value}</Text>
								<Text style={[styles.statLabel, stat.label === "total" && styles.statLabelActive]}>{stat.label}</Text>
							</View>
						))}
					</View>

					<View style={styles.dailyCard}>
						<Text style={styles.cardText}>Today's Outfit</Text>
					</View>

					<View style={styles.secondRow}>
						<View style={styles.weatherCard}>
							{weather?.weather?.[0]?.icon ? <Image source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png` }} style={styles.weatherIcon} /> : null}
							<Text style={styles.cardText}>{weather?.weather?.[0]?.main || "weather forecast"}</Text>

							{weatherLoading ? (
								<ActivityIndicator size="small" color="#8A5F5F" style={{ marginTop: 8 }} />
							) : weatherError ? (
								<Text style={styles.weatherDescription}>{weatherError}</Text>
							) : weather?.weather?.[0]?.description ? (
								<Text style={styles.weatherDescription}>{weather.weather[0].description}</Text>
							) : (
								<Text style={styles.weatherDescription}>weather unavailable</Text>
							)}

							{weather?.main?.temp !== undefined ? <Text style={styles.weatherTemp}>{Math.round(weather.main.temp)}°F</Text> : null}
						</View>

						<UploadCard />
					</View>

					<View style={{ height: 100 }} />
				</ScrollView>

				<View style={styles.tabBar}>
					<TouchableOpacity style={styles.tabItem}>
						<View style={styles.tabIconActive}>
							<MaterialCommunityIcons name="home-outline" size={24} color="#8A5F5F" />
						</View>
					</TouchableOpacity>

					<UploadPlusButton />

					<TouchableOpacity style={styles.tabItem} onPress={() => router.push("/closet")}>
						<MaterialCommunityIcons name="hanger" size={24} color="#b0968e" />
					</TouchableOpacity>

					<TouchableOpacity style={styles.tabItem} onPress={() => router.push("/settings")}>
						<MaterialCommunityIcons name="tune-variant" size={24} color="#b0968e" />
					</TouchableOpacity>
				</View>

				<ItemCard />
			</LinearGradient>
		</UploadProvider>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { flex: 1 },
	scrollContent: { paddingHorizontal: 18 },
	statusSpacer: { height: 80 },
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
	statLabelActive: { color: "#8A5F5F" },
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
	weatherIcon: { width: 60, height: 60, marginBottom: 6 },
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
	tabItem: { alignItems: "center", gap: 3 },
	tabIconActive: {
		width: 28,
		height: 28,
		borderRadius: 8,
		backgroundColor: "rgba(138,95,95,0.15)",
		justifyContent: "center",
		alignItems: "center",
	},
});
