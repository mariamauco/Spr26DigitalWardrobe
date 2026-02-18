import { Text, View, StyleSheet } from 'react-native';

export default function SignUpScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sign Up</Text>
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
	},
});