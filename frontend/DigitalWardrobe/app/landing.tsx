import { Text, View, StyleSheet, Image, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import NavBar from "../components/features/navbar";
import OmbreBackground from "../components/features/ombrebackground";
import GridOverlay from "../components/features/gridoverlay";
import closetImage from '../assets/images/closet_graphic.png';
import Button from "../components/ui/button";
import { useRouter } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';


export default function LandingScreen() {

	const router = useRouter();
	return (
		<View style={styles.container}>
			<OmbreBackground />
			<GridOverlay />
			<NavBar />

			<ScrollView 
							contentContainerStyle={styles.mainScrollContent}
							showsVerticalScrollIndicator={false}>

			<View style={styles.landingContainer}>
				<View style={styles.content}> 
					<View style={styles.landingContent}>
						<Text style={[styles.title, {marginBottom:10}]}>Your Wardrobe.<nav>Styled for your day.</nav></Text>
						<Text style={[styles.text, {marginVertical:10}]}>Digitize your closet, build outfits, and rediscover what you love.</Text>
						<View style={{alignItems:'center', margin:40}}><Button title="Get Started" onPress={() => router.replace("/signUp")} /></View>
					</View>

				</View>
				<View style={styles.content}>
					<Image
						source={closetImage}
						style={styles.closetImage}
						accessibilityLabel="Graphic of a closet"
						resizeMode="contain"
					/>
				</View>

			</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		
	},
	mainScrollContent:{
		flexGrow:1,
		justifyContent:'center',
		paddingVertical:40,
	},
	landingContainer:{
		flexDirection:'row',
		gap: 10,
		width:'70%',
		maxWidth: 1100,
		alignSelf: 'center',
		justifyContent:'center',
		alignItems: 'center',
		marginVertical: 40,
	},
	landingContent:{
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		gap: 12,
	},

	title: {
		fontSize: 40,
		fontWeight: '600',
		textAlign: 'left',
		fontFamily: 'DM Serif Display',
		color: "#534047",
		marginBottom: 8,
	},
	text:{
		// Digitize your closet, build outfits, and rediscover what you love.
		color: '#4E4E4E',
		fontSize: 20,
		fontFamily: 'DM Serif Display',
		fontWeight: '600',
		letterSpacing:.5,
		wordWrap: 'break-word'
	},

	link: {
		color: "#2563eb",
		fontSize: 16,
	},

	closetImage: {
		width: 500,
		height: 661,
		maxWidth: '100%',
	}
});