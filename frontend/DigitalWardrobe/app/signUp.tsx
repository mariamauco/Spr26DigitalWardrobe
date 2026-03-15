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
import NavBar from "../components/features/navbar";
import { replace } from 'expo-router/build/global-state/routing';

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
			<NavBar />
			
			
			<View style={styles.signUpContainer}>
				<View style={styles.glassWrapper}>
					<PlaceholderCard 
						width="100%" 
						height="100%"
						backgroundColor="rgba(255,255,255,0.35)"
						style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
					>
						<KeyboardAvoidingView 
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							style={{ flex: 1, marginBottom:340 }}
						>
							<ScrollView contentContainerStyle={styles.scrollContent}>
									<View style={[styles.header, {marginTop:27}]}>
										<Text style={styles.title}>Let's Get Started</Text>
									</View>
									<View style={{margin:10, marginBottom:50}}>
										<Text style={{fontSize:24, fontFamily: "PlusJakartaSans_700Bold",letterSpacing:1,}}>Already have an account?</Text>
									</View>
									<Button title="Log In" onPress={() => router.replace("/logIn")} />
							</ScrollView>
						</KeyboardAvoidingView>

					</PlaceholderCard>
				</View>
				<View style={[styles.glassWrapper]}>
					<PlaceholderCard 
						width="100%" 
						height="100%" 
						backgroundColor="rgba(220, 160, 160, 0.5)"
						style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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
											style={{fontSize:20}} 
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
										
										
										
										
										<View
											style={{
												display: "flex",
												flexDirection: "row",
												width: "72%",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<TextBox
												style={{ marginRight: 20, width: "35%" }}
												placeholder="zip code"
												value={zipCode}
												onChangeText={(text) => {
													setZipCode(text);
													setErrorMessage(null);
												}}
											/>

											<View style={{ width: "65%" }}>
												<Dropdown
													value={country}
													onValueChange={setCountry}
													items={countries}
													placeholder="Select a country"
													containerStyle={{}}
													style={{ backgroundColor: "#FEFDF4", borderRadius: 10, height: 48 }}
													placeholderStyle={{ color: "#7d7373", fontSize: 20 }}
													name="country"
													id="country"
												/>
											</View>
										</View>
										
										{errorMessage && (
											<View style={styles.errorBox}>
											<Text style={styles.errorText}>{errorMessage}</Text>
											</View>
										)}
										<View style={{marginTop:20}}/>
										<Button title="Sign up" onPress={signUp} variant='white' />
									</View>
							</ScrollView>
						</KeyboardAvoidingView>
					</PlaceholderCard>
			
				</View>
			</View>

		</View>
		</>
	);
}

const styles = StyleSheet.create({
	mainContainer: {
        flex: 1, // This ensures the background covers the whole screen
		justifyContent: "center",
    },

	signUpContainer:{
		display: "flex",
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignContent: "center",
		width: "70%",
		alignItems: "center",
		alignSelf:"center",
		margin:100

	},

	glassWrapper: {
		//position: "absolute",
		display:"flex",
		flexDirection:"column",
		height:"100%",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		width:"50%",
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
        marginBottom: 50,
        alignItems: 'center',
    },
	title: {
		color: "#8A5F5F",
		fontFamily: "PlusJakartaSans_700Bold", // see note below
		fontSize: 52,
		fontWeight: "700",
	},	
	container: {
		width: '100%',
		alignItems: 'center',
		gap: 24,
	},
	pickerWrapper: {
        alignSelf: "center", 
        marginVertical: 10,
		width: 438,
		height: 48,
		borderRadius: 10,
		backgroundColor: "#FEFDF4",
		paddingHorizontal: 12,

		// iOS shadow
		shadowColor: "#DCA0A0",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 4,

		// Android shadow
		elevation: 4,
    },
	errorBox: {
		backgroundColor: "#f7b0b6",
		borderRadius: 8,
		padding: 10,
		width: "73%",
		alignSelf: "center",
	},

	errorText: {
		color: "#842029",
		fontSize: 20,
		textAlign: "center",
	}
});