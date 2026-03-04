import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from "react";
import { Pressable } from "react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
// imports for components
import Button from "../components/ui/button";
import OmbreBackground from "../components/features/ombrebackground";
import GridOverlay from "../components/features/gridoverlay";
import TextBox from "../components/ui/textBox";

export default function LogInScreen() {

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");	
	const router = useRouter();

	const login = async () => {

    	console.log("LOGIN FUNCTION CALLED");

		// check to see if user entered in all values
		if (!email || !password) {
			Alert.alert("Error", "All fields are required");
			return;
		}

		const payload = {
			email,
			password
		};

		try {
		const response = await fetch("http://138.197.16.179:5050/api/auth/login", {
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
			Alert.alert("Login Failed", data.message || "Invalid credentials");
			return;
		}

		Alert.alert("Success", "Login successful!"); // sends notification to user that login was succesful

		const statusResponse = await fetch("http://138.197.16.179:5050/api/auth/login", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const statusData = await statusResponse.json();
            
			// If onboarding is false, send to onboarding page
            if (statusData.onboarding === false) {
                router.replace("/onboarding");
            } else { // If already onboarded, send to dashboard
                router.replace("/dashboard");
            }

		} catch (error) {
		Alert.alert("Error", "Login failed. Please try again."); // sends notification to user that login was NOT succesful
		console.error("Error:", error);
		}
	};

	
	return (
		<>
		<View style={styles.mainContainer}>
			<OmbreBackground />
			<GridOverlay />
			
			<KeyboardAvoidingView 
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
						<View style={styles.header}>
							<Text style={styles.title}>Welcome Back</Text>
						</View>

						<View style={styles.container}>
							<TextBox 
								placeholder='email' 
								value={email} 
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
							<TextBox 
								placeholder='password' 
								secureTextEntry 
								value={password} 
								onChangeText={setPassword}
							/>
							<Button title="Log In" onPress={login} />
						</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
		</>
	);
}

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1, // This ensures the background covers the whole screen
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	header: {
		marginBottom: 20,
		alignItems: 'center',
	},
	title: {
		color: "#8A5F5F",
		fontFamily: "Poppins_700Bold", // see note below
		fontSize: 36,
		fontWeight: "700",
	},	
	container: {
		width: '100%',
		alignItems: 'center',
		gap: 24,
	},
	pickerWrapper: {
		width: "80%", 
		alignSelf: "center", 
		marginVertical: 10 
	}
});	