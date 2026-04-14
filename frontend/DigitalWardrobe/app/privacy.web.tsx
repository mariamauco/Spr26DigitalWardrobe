import { Text, View, StyleSheet, ScrollView } from 'react-native';
import NavBar from "../components/features/navbar";
import OmbreBackground from "../components/features/ombrebackground";
import GridOverlay from "../components/features/gridoverlay";

export default function PrivacyScreen(){

    return (
        <View style={styles.container}>
            <OmbreBackground />
            <GridOverlay />
            <NavBar />

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.contentContainer}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.policyCard}>
					<Text style={styles.eyebrow}>Privacy Policy Card</Text>
					<Text style={styles.title}>Privacy Policy for WEECS DigitalWardrobe Project</Text>
					<Text style={styles.updated}>Last Updated: March 24, 2026</Text>

					<Text style={styles.paragraph}>
						This Privacy Policy describes how the Women in Engineering and Computer Science (WEECS)
						DigitalWardrobe team collects, uses, and handles data in connection with our academic
						machine learning project.
					</Text>

					<Text style={styles.sectionTitle}>1. What data we collect and for how long</Text>
					<Text style={styles.paragraph}>
						Our application accesses data exclusively from public Pinterest boards curated specifically
						by our student team. The data we collect includes:
					</Text>
					<Text style={styles.bullet}>- Pin Image URLs</Text>
					<Text style={styles.bullet}>- Pin Titles and Descriptions</Text>
					<Text style={styles.bullet}>- Board Categorization tags</Text>
					<Text style={styles.paragraph}>
						We do not collect, solicit, or store any personal user information, login credentials, or
						user analytics. The image and text data is retained only for the duration of our academic
						project or semester. Once the machine learning model has been trained and graded, the raw
						dataset will be permanently deleted from our local servers.
					</Text>

					<Text style={styles.sectionTitle}>2. How the data is used</Text>
					<Text style={styles.paragraph}>
						The data collected via the Pinterest API is used strictly for internal, educational
						purposes. Specifically, it is used to compile a visual dataset to fine-tune a local
						FashionCLIP machine learning model. This app does not post to Pinterest, schedule Pins, or
						provide analytics. It is a read-only tool for academic data compilation.
					</Text>

					<Text style={styles.sectionTitle}>3. Third-party data sharing</Text>
					<Text style={styles.paragraph}>
						We do not share, sell, or distribute any data collected from Pinterest to third parties,
						data brokers, or advertising networks. The dataset remains strictly local to our university
						student team for the sole purpose of this educational exercise.
					</Text>

					<Text style={styles.sectionTitle}>4. Contact Us</Text>
					<Text style={styles.paragraph}>
						If you have any questions about this privacy policy or our academic project&apos;s data handling,
						 contact our project lead at:
					</Text>
					<Text style={styles.contact}>maria.mauco@ucf.edu</Text>
				</View>
			</ScrollView>
        </View>
    )

}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},

	scrollView: {
		flex: 1,
	},

	contentContainer: {
		paddingHorizontal: 18,
		paddingTop: 104,
		paddingBottom: 36,
		alignItems: 'center',
	},

	policyCard: {
		width: '100%',
		maxWidth: 860,
		backgroundColor: 'rgba(255, 255, 255, 0.95)',
		borderColor: 'rgba(15, 23, 42, 0.16)',
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 22,
		paddingVertical: 24,
		shadowColor: '#000',
		shadowOpacity: 0.14,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 6,
	},

	eyebrow: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1.1,
		textTransform: 'uppercase',
		color: '#334155',
		marginBottom: 10,
	},

	title: {
		fontSize: 28,
		lineHeight: 36,
		fontWeight: '700',
		color: '#0f172a',
		marginBottom: 8,
	},

	updated: {
		fontSize: 13,
		fontWeight: '600',
		color: '#475569',
		marginBottom: 18,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(15, 23, 42, 0.1)',
	},

	sectionTitle: {
		fontSize: 19,
		lineHeight: 26,
		fontWeight: '700',
		color: '#1e293b',
		marginTop: 18,
		marginBottom: 10,
	},

	paragraph: {
		fontSize: 15,
		lineHeight: 24,
		fontWeight: '400',
		color: '#0f172a',
		marginBottom: 10,
	},

	bullet: {
		fontSize: 15,
		lineHeight: 24,
		fontWeight: '500',
		color: '#0f172a',
		marginBottom: 4,
		paddingLeft: 6,
	},

	contact: {
		fontSize: 15,
		lineHeight: 24,
		fontWeight: '700',
		color: '#0b3b66',
	}
});