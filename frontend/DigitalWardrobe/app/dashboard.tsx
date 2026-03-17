import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { getToken } from "../app/authStorage";
import { useUser } from "../components/features/userContext";
import { LinearGradient } from "expo-linear-gradient";
import GridOverlay from "../components/features/gridoverlay";
import DashboardSidebar from "../components/features/dashboardSidebar";
import GalleryCarousel from "../components/ui/galleryCard";
import { ScrollView } from "react-native";

export default function DashboardScreen() {
	const [weather, setWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
  	const [weatherError, setWeatherError] = useState<string | null>(null);
  
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
			try{
				const userResponse = await fetch("http://138.197.16.179:5050/api/auth/user", {
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
	  
				const weatherResponse = await fetch("http://138.197.16.179:5050/api/weather", {
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
		{/* LEFT: Daily Outfit Card */}
		<View style={styles.dailyCard}>
			<Text style={styles.cardText}>daily outfit</Text>

			{/* ✅ Gallery goes here */}
			<View style={{ marginTop: 20 }}>
			<GalleryCarousel width={400} height={500} />
			</View>
		</View>

		{/* RIGHT: Weather + Small Card */}
		<View style={styles.rightColumn}>
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

			<View style={styles.smallCard} />
		</View>
		</View>
		</ScrollView>
      </View>
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
});