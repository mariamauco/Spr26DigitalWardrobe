import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import NavBar from "../components/features/navbar";

export default function LandingScreen() {
	return (
		<View style={styles.container}>
			<NavBar />

			<View style={styles.content}>
				<Text style={styles.title}>Welcome to DigitalWardrobe</Text>

				<Link href="/signUp" style={styles.link}>Go to sign up</Link>
				<Link href="/login" style={styles.link}>Go to log in</Link>
				<Link href="/dashboard" style={styles.link}>Go to Dashboard</Link>
				<Link href="/onboarding" style={styles.link}>Go to Onboarding</Link>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},

	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		gap: 12,
	},

	title: {
		fontSize: 24,
		fontWeight: '600',
		textAlign: 'center',
		color: "#111",
		marginBottom: 8,
	},

	link: {
		color: "#2563eb",
		fontSize: 16,
	}
});