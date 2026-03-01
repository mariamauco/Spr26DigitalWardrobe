import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function LandingScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Welcome to DigitalWardrobe</Text>
			<Link href="/signUp" style={styles.link}>Go to sign up</Link>
			<Link href="/logIn" style={styles.link}>Go to log in</Link>
			<Link href="/dashboard" style={styles.link}>Go to Dashboard</Link>
			<Link href="/onboarding" style={styles.link}>Go to Onboarding</Link>

        </View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
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