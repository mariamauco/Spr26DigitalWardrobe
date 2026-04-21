import { Text, View, StyleSheet, Pressable } from 'react-native';
import React, { useState } from "react";
import {useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { saveToken } from "../utils/authStorage";
// imports for components
import Button from "../components/ui/button";
import OmbreBackground from "../components/features/ombrebackground";
import GridOverlay from "../components/features/gridoverlay";
import TextBox from "../components/ui/textBox";

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

					{/* Log In button */}
					<Button
						title="Log In"
						onPress={login}
					/>
				</View>

					{/* Footer message*/}

					<Pressable onPress={() => router.replace("/signUp")}> 
						<Text style={styles.signUpText}>Sign up</Text>
					</Pressable>
			</View>
		</View>
		</>
	);
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    mainScrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // Centers the form vertically on the screen
    },
    logInContainer: {
        flex: 1,
        flexDirection: "column", // CRITICAL: Stacks elements vertically
        alignItems: "center",
        justifyContent: "center",
        width: "90%",
        alignSelf: "center",
        marginVertical: 40,
    },
    header: {
        marginBottom: 30, // Space between "Log In" title and inputs
    },
    title: {
        color: "#8A5F5F",
        fontFamily: "DMSerifDisplay_400Regular", 
        fontSize: 48,
        textAlign: 'center',
    },
    container: {
        width: '100%',
        maxWidth: 320, // Keeps inputs from getting too wide on tablets
        alignItems: 'center',
        gap: 20, // Spacing between your text boxes
    },
    errorBox: {
        backgroundColor: "#f7b0b6",
        borderRadius: 8,
        padding: 10,
        width: "100%",
        marginTop: 10,
    },
    errorText: { 
        color: "#842029", 
        fontSize: 16, 
        textAlign: "center" 
    },
    signUpText: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 22,
        fontWeight: '700',
        color: '#8A5F5F',
        textDecorationLine: 'underline',
        marginTop: 30,
    },
});