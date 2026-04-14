import { Text, View, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
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
			{/* Layered background components let content stay simple while visuals remain rich. */}
			<OmbreBackground />
			<GridOverlay />

			{/* <ScrollView
				contentContainerStyle={styles.mainScrollContent}
				showsVerticalScrollIndicator={false}
			> */}
			<View style={styles.mainScrollContent}>
				<View style={styles.headerWrap}>
					<Text style={styles.brand}>Digital Wardrobe</Text>
				</View>

				<View style={styles.contentWrap}>
					{/* Use explicit line breaks in Text instead of HTML tags like <br/> or <nav>. */}
					<Text style={styles.title}>Your wardrobe.{"\n"}Styled for your day.</Text>

					<Image
						source={closetImage}
						style={styles.closetImage}
						accessibilityLabel="Graphic of a closet"
						resizeMode="contain"
					/>

					<View style={styles.ctaWrap}>
						<Button
							title="Get Started"
							onPress={() => router.replace("/signUp")}
							buttonStyle={styles.ctaButton}
						/>
					</View>

					{/* Secondary action is lighter and text-only to keep visual design. */}
					<Pressable onPress={() => router.replace("/logIn")}> 
						<Text style={styles.loginText}>Log In</Text>
					</Pressable>
				</View>
			{/* </ScrollView> */}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		/* flex: 1 means this screen fills the full device viewport. */
		flex: 1,
		backgroundColor: "#FDEDEB",
	},
	mainScrollContent: {
		/* flexGrow keeps content centered when there is extra vertical space. */
		flexGrow: 1,
		paddingTop: 100,
		/* Bottom padding keeps actions clear of the iOS home indicator area. */
		paddingBottom: 32,
		paddingHorizontal: 20,
	},
	headerWrap: {
		marginBottom: 40,
	},
	brand: {
		/* Centered title for mobile keeps first glance readable. */
		textAlign:'center',
		fontSize: 40,
		lineHeight: 62,
		fontFamily: 'DM Serif Display',
		color: '#56414C',
	},
	contentWrap: {
		/* Use percentage width + maxWidth to scale across phone sizes. */
		width: '80%',
		height:'100%',
		maxWidth: 360,
		alignSelf: 'center',
		alignItems: 'center',
	},
	title: {
		/* Mobile type should be large enough for scanability but not dominate above the image. */
		fontSize: 24,
		lineHeight: 32,
		fontWeight: '600',
		textAlign: 'left',
		alignSelf: 'flex-start',
		fontFamily: 'DM Serif Display',
		color: '#2F3135',
		marginBottom: 20,

	},
	closetImage: {
		/* width: 100% keeps the image responsive inside the container. */
		width: '100%',
		height: 410,
		marginBottom: 26,
	},
	ctaWrap: {
		/* React Native uses numbers (dp), not CSS strings like '331px'. */
		width: 331,
		height: 51,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
	},
	ctaButton: {
		/* keep fixed to design: 331 x 51. */
		width: 331,
		height: 51,
	},
	loginText: {
		fontFamily: 'DM Serif Display',
		fontSize: 22,
		fontWeight: '700',
		color: '#6A6A6A',
		textDecorationLine: 'underline',
	},
});