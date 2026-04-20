import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

type WeatherCardProps = {
	weather: any;
	loading: boolean;
	error: string | null;
};

export default function WeatherCard({ weather, loading, error }: WeatherCardProps) {
	return (
		<View style={styles.weatherCard}>
			{weather?.weather?.[0]?.icon ? (
				<Image
					source={{
						uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
					}}
					style={styles.weatherIcon}
				/>
			) : null}

			<Text style={styles.cardText}>{weather?.weather?.[0]?.main || "weather forecast"}</Text>

			{loading ? (
				<Text style={styles.weatherDescription}>loading weather...</Text>
			) : error ? (
				<Text style={styles.weatherDescription}>{error}</Text>
			) : weather?.weather?.[0]?.description ? (
				<Text style={styles.weatherDescription}>{weather.weather[0].description}</Text>
			) : (
				<Text style={styles.weatherDescription}>weather unavailable</Text>
			)}

			{weather?.main?.temp !== undefined ? (
				<Text style={styles.weatherTemp}>{Math.round(weather.main.temp)}°F</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	weatherCard: {
		width: 293,
		height: 283,
		backgroundColor: "rgba(254, 253, 244, 0.6)",
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 16,
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
