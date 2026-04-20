import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getToken } from "../utils/authStorage";
import { useUser } from "../components/features/userContext";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import GalleryCarousel from "../components/ui/galleryCard";
import { UploadProvider, UploadCard, ItemCard } from "@/components/features/uploadItem";
import WeatherCard from "../components/features/weatherCard";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export default function DashboardScreen() {
    const router = useRouter();
	const { user, setUser } = useUser();
	const [weather, setWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
	const [weatherError, setWeatherError] = useState<string | null>(null);

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				// Require a token before loading dashboard data.
				// If the user is not authenticated, send them to the login screen.
				const token = await getToken();
				if (!token) {
                    router.replace("/logIn");
					return;
				}

				try {
					const userResponse = await fetch(`${API_URL}/api/auth/user`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					});

					const userData = await userResponse.json();

					if (userResponse.ok) {
						setUser(userData);
					}
				} catch (userErr) {
					console.log("User fetch error:", userErr);
				}

				// Load the current user so the greeting and sidebar stay in sync.
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
						setWeatherError(
							weatherData?.message || weatherData?.error || "Unable to load weather"
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
	}, [setUser]);

	return (
		<LinearGradient colors={["#FDECEB", "rgba(246,242,223,0.90)"]} style={styles.container}>
			<UploadProvider>
			<GridOverlay />
				<View style={styles.contentWrapper}>
					{/* Left rail stays fixed while the main dashboard content scrolls. */}
					<DashboardSidebar
						username={user?.name || "User"}
						activeScreen="dashboard"
						onLogout={() => {
							console.log("Log out pressed");
						}}
					/>

					<ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
						<Text style={styles.greeting}>HELLO, {user?.name ? user.name.toUpperCase() : "USER"}!</Text>

						{/* Main dashboard content is split into two. */}
						<View style={styles.mainRow}>
							{/* Daily outfit space; still uses the shared carousel component. */}
							<View style={styles.dailyCard}>
								<Text style={styles.cardText}>Today's Outfit</Text>
								<View style={{ marginTop: 20 }}>
									<GalleryCarousel width={500} height={500} />
								</View>
							</View>

							{/* Right column groups weather and upload actions so they read as utilities. */}
							<View style={styles.rightColumn}>
								{/* Weather card is extracted so the dashboard only handles page layout. */}
								<WeatherCard weather={weather} loading={weatherLoading} error={weatherError} />

								{/* Upload flow is fully encapsulated in the reusable UploadItem component. */}
								<UploadCard/>
							</View>
						</View>
					</ScrollView>
				</View>

				<ItemCard/>
			</UploadProvider>
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
		width: 550,
		height: 590,
		backgroundColor: "rgba(254, 253, 244, 0.6)",
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	rightColumn: {
		gap: 28,
		alignItems: "center",
		height:280
	},
	cardText: {
		color: "#8A5F5F",
		fontSize: 24,
		fontFamily: "DMSerifDisplay_400Regular",
		textAlign: "center",
	},
});
