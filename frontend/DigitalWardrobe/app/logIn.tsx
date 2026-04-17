import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import React, { useState } from "react";
import {useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { saveToken } from "../utils/authStorage";
// imports for components
import Button from "../components/ui/button";
import OmbreBackground from "../components/features/ombrebackground";
import GridOverlay from "../components/features/gridoverlay";
import TextBox from "../components/ui/textBox";
import Dropdown from "../components/ui/dropdown";
import PlaceholderCard from "../components/ui/card";
import NavBar from "../components/features/navbar";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// Main login screen component
export default function LogInScreen() {


	const {width} = useWindowDimensions();
	const isMobile = width < 768;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");	
	const [token, setToken] = useState("");
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const login = async () => {

		// check to see if user entered in all values
		if (!email.trim() || !password.trim()) {
  			setErrorMessage("All fields are required.");
			return;
		}

		setErrorMessage(null); // clear error if everything is valid

		const payload = {
			email,
			password
		};

		try {
		const response = await fetch(`${API_URL}/api/auth/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		});

      	console.log("Status:", response.status);

		const data = await response.json();
		console.log("Response:", data);

		if (!response.ok) {
			setErrorMessage(data.message || data.error || "Invalid email or password");
			console.log(errorMessage);
			return;
		}

		const authToken = data.token;
		setToken(authToken);
		await saveToken(authToken);

		const onboardingRes = await fetch(`${API_URL}/api/onboarding`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
					"Authorization": `Bearer ${authToken}`
                },
            });

            const onboardingData = await onboardingRes.json();

			// If onboarding is false, send to onboarding page
            if (onboardingData == null || onboardingData.completed === false) {
                router.replace("../onboarding/");
            } else { // If already onboarded, send to dashboard
                router.replace("/dashboard");
            }

		} catch (error) {
			// sends console message that login was NOT succesful
			console.error("Error:", error);
		}
	};
	
	return (
		<>
		<View style={styles.mainContainer}>
			<OmbreBackground />
			<GridOverlay />
			<NavBar />
							
			<ScrollView 
				contentContainerStyle={styles.mainScrollContent}
				showsVerticalScrollIndicator={false}
			>
				<KeyboardAvoidingView 
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							style={[styles.keyboardView]}
				>
					<View style={styles.logInContainer}>
						{/* Title header */}
						<View style={styles.header}>
							<Text style={styles.title}>Log In</Text>
						</View>

						<View style={styles.container}>
							{/* Email input field */}
							<TextBox 
								placeholder='email' 
								value={email} 
								onChangeText={(text) => {
									setEmail(text);
									setErrorMessage(null);
								}}								
								keyboardType="email-address"
								autoCapitalize="none"
							/>
							{/* Password input field */}
							<TextBox 
								placeholder='password' 
								secureTextEntry 
								value={password} 
								onChangeText={(text) => {
									setPassword(text);
									setErrorMessage(null);
								}}
							/>

							{/* Error message display */}
							{errorMessage && (
								<View style={styles.errorBox}>
									<Text style={styles.errorText}>{errorMessage}</Text>
								</View>
							)}				
							<View style={{marginTop:20}}/>
								{/* Log In button */}
								<Button title="Log In" onPress={login} />
							</View>

							{/* Footer message*/}

							<Pressable onPress={() => router.replace("/signUp")}> 
								<Text style={styles.signUpText}>Sign up</Text>
							</Pressable>
						</View>
				</KeyboardAvoidingView>
			</ScrollView>
		</View>
		</>
	);
}

const styles = StyleSheet.create({
	
	mainContainer: {
        flex: 1, // This ensures the background covers the whole screen
		justifyContent: "center",
    },

	mainScrollContent:{
		flexGrow:1,
		justifyContent:'center',
		paddingVertical:40,
	},

	keyboardView:{
		flex:1,
	},

	logInContainer:{
		display: "flex",
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignContent: "center",
		width: "90%", // 90% on mobile
		maxWidth:1150,
		minHeight:500,
		marginVertical:40,
		alignItems: "center",
		alignSelf:"center",

	},
    header: {
		height:60,
		marginBottom:40,
        alignItems: 'center',
		justifyContent:'center'
    },
	title: {
		color: "#8A5F5F",
		fontFamily: "DMSerifDisplay_400Regular", 
		letterSpacing:1,
		fontSize: 36,
		fontWeight: "600",
		textAlign:'center',
	},	
	container: {
		width: '100%',
		alignItems: 'center',
		gap: 16,
	},
	signUpText: {
		fontFamily: 'DM Serif Display',
		fontSize: 22,
		fontWeight: '700',
		color: '#6A6A6A',
		textDecorationLine: 'underline',
	},
	/*
	inputWrapper: {
        backgroundColor: "#FEFDF4",
        borderRadius: 12,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: "#DCA0A0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 5,
    },*/
	errorBox: {
		backgroundColor: "#f7b0b6",
		borderRadius: 8,
		padding: 10,
		width: "73%",
		alignSelf: "center",
	},

	errorText: { color: "#842029", fontSize: 20, textAlign: "center" }
});	