import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function LandingScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Welcome to DigitalWardrobe</Text>
		<Link href='/signUp'>Go to sign up</Link>
        <Link href='/logIn'>Go to log in</Link>
        <Link href='/dashboard'>Go to Dashboard</Link>
        </View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		textAlign: 'center',
	},
});