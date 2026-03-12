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
import Dropdown from "../components/ui/dropdown";
import PlaceholderCard from "../components/ui/card";
import { countries } from "../components/features/countryCodes";

// when sign up button is pressed this function is called
// sends user info to backend
export default function SignUpScreen() {

	const [name, setName] = useState("");
  	const [email, setEmail] = useState("");
  	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [zipCode, setZipCode] = useState<string>("");
	const [country, setCountry] = useState<string | null>(null);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

	const signUp = async () => {

		console.log("SIGNUP FUNCTION CALLED");

		// check to see if user entered in all values
		if (!name.trim() || !email.trim() || !password.trim() || !zipCode.trim() || !country) {
  			setErrorMessage("All fields are required.");
			return;
		}

		if (!confirmPassword.trim()) {
			setErrorMessage("Please confirm your password.");
			return;
		}

		if (password !== confirmPassword) {
			setErrorMessage("Passwords do not match.");
			return;
		}	

		setErrorMessage(null); // clear error if everything is valid

		const payload = {
			name,
			email,
			password,
			zipCode,
			country
		};
		
		console.log("Selected country:", country);
		
		try {
		const response = await fetch("http://138.197.16.179:5050/api/auth/register", {
			method: "POST",
			headers: {
			"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		console.log({ name, email, password, zipCode, country });
      	console.log("Status:", response.status);

		const data = await response.json();
		console.log("Response:", data);

		// this alert is not triggering ;-; the status is 201 when logged
		if (response.status === 201) {
			Alert.alert("Success", "Sign up successful!");
			await delay(1000);
			router.replace("../onboarding")
			return;
		} else {
			Alert.alert("SignUp Failed", data.message || "Invalid credentials");
			setErrorMessage(data.message); // set error message if returned by API
			return;
		}
		} 
		catch (error) {
			window.alert("Signup failed. Please try again.");
			console.error("Error:", error);
		}
	};

	return (
		<>
		<View style={styles.mainContainer}>
			<OmbreBackground />
			<GridOverlay />
			
			<View style={styles.glassWrapper}>
				<PlaceholderCard 
					width="90%" 
					height="80%" 
					backgroundColor="rgba(255,255,255,0.35)"
				>
					<KeyboardAvoidingView 
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
					>
						<ScrollView contentContainerStyle={styles.scrollContent}>
								<View style={styles.header}>
									<Text style={styles.title}>Create Account</Text>
								</View>

								<View style={styles.container}>
									<TextBox 
										placeholder='name' 
										value={name} 
										onChangeText={(text) => {
											setName(text);
											setErrorMessage(null);
										}}
									/>
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
									<TextBox 
										placeholder='password' 
										secureTextEntry 
										value={password} 
										onChangeText={(text) => {
											setPassword(text);
											setErrorMessage(null);
										}}
									/>
									<TextBox 
										placeholder='retype password' 
										secureTextEntry 
										value={confirmPassword} 
										onChangeText={(text) => {
											setConfirmPassword(text);
											setErrorMessage(null);
										}}							/>
									<TextBox 
										placeholder='zip code' 
										value={zipCode} 
										onChangeText={(text) => {
											setZipCode(text);
											setErrorMessage(null);
										}}							/>
									
									<View style={styles.pickerWrapper}>
										<Dropdown
											value={country}
											onValueChange={setCountry}
											items={countries}
											placeholder="Select a country"
										/>
									</View>
									
									{errorMessage && (
										<View style={styles.errorBox}>
										<Text style={styles.errorText}>{errorMessage}</Text>
										</View>
									)}

									<Button title="Sign up" onPress={signUp} />
								</View>
						</ScrollView>
					</KeyboardAvoidingView>
				</PlaceholderCard>
			</View>

		</View>
		</>
	);
}

const styles = StyleSheet.create({
	mainContainer: {
        flex: 1, // This ensures the background covers the whole screen
    },
	glassWrapper: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1, // places it on top of the background
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
    },
	errorBox: {
		backgroundColor: "#f7b0b6",
		borderRadius: 8,
		padding: 10,
		width: "80%",
		alignSelf: "center",
	},

	errorText: {
		color: "#842029",
		fontSize: 14,
		textAlign: "center",
	}
});