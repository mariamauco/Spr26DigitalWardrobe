import { Text, View, StyleSheet } from 'react-native';

export default function DashboardScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Dashboard</Text>
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