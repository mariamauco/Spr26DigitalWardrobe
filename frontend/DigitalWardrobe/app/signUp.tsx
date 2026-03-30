import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from "react";

import { Pressable, useWindowDimensions } from "react-native";
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

const API_URL = process.env.EXPO_PUBLIC_API_URL

// when sign up button is pressed this function is called
// sends user info to backend
export default function SignUpScreen() {

	const {width} = useWindowDimensions();
	const isMobile = width < 768;

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
		const response = await fetch(`${API_URL}/api/auth/register`, {
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
			<ScrollView 
				contentContainerStyle={styles.mainScrollContent}
				showsVerticalScrollIndicator={false}
			>
				<KeyboardAvoidingView 
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							style={[styles.keyboardView]}
				>
					<View style={styles.signUpContainer}>
						{/* Left panel - Login redirect section */}
						<View style={[styles.glassWrapper, ]}>
					
							<PlaceholderCard 
								width="100%" 
								height="100%"
								backgroundColor="rgba(255,255,255,0.35)"
								style={{...styles.innerContent, borderTopRightRadius:0, borderBottomRightRadius:0}}
							>
								<View style={{height:545, alignItems:'center'}}>
									<View style={[styles.header]}>
										<Text style={styles.title}>Let's Get Started</Text>
									</View>
									{/* Prompt existing users to log in */}
									<View style={{marginBottom:20}}>
										<Text style={{fontSize:20, fontFamily: "DMSerifDisplay_400Regular",letterSpacing:1,marginBottom:20}}>Already have an account?</Text>
									</View>
									<Button title="Log In" onPress={() => router.replace("/logIn")} />
								</View>
							</PlaceholderCard>
						</View>

						{/* Right panel - Sign up form section */}
						<View style={[styles.glassWrapper]}>
							<PlaceholderCard 
								width="100%" 
								height="100%" 
								backgroundColor="rgba(220, 160, 160, 0.5)"
								style={{...styles.innerContent, borderTopLeftRadius: 0, borderBottomLeftRadius: 0}}
							>
								<View style={{height:545}}>
									<View style={styles.header}>
										<Text style={styles.title}>Create Account</Text>
									</View>

									<View style={styles.container}>
										{/* Name input field */}
										<TextBox 
											placeholder='name' 
											value={name} 
											onChangeText={(text) => {
												setName(text);
												setErrorMessage(null);
											}}
										/>
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
										{/* Confirm password input field */}
										<TextBox 
											placeholder='retype password' 
											secureTextEntry 
											value={confirmPassword} 
											onChangeText={(text) => {
												setConfirmPassword(text);
												setErrorMessage(null);
											}}							/>
										
										{/* Zip code and country selection row */}
										<View
											style={{
												display: "flex",
												flexDirection: "row",
												width: "72%",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{/* Zip code input */}
											<TextBox
												style={{ marginRight: 20, width: "35%" }}
												placeholder="zip code"
												value={zipCode}
												onChangeText={(text) => {
													setZipCode(text);
													setErrorMessage(null);
												}}
											/>

											{/* Country dropdown selector */}
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
										
										{/* Error message display */}
										{errorMessage && (
											<View style={styles.errorBox}>
											<Text style={styles.errorText}>{errorMessage}</Text>
											</View>
										)}
										<View style={{marginTop:20}}/>
										{/* Sign up submission button */}
										<Button title="Sign up" onPress={signUp} variant='white' />
									</View>
								</View>
							</PlaceholderCard>
			
						</View>
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

	signUpContainer:{
		display: "flex",
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignContent: "center",
		width: "90%", // 90% on mobile
		maxWidth:1150,
		minHeight:750,
		marginVertical:40,
		alignItems: "center",
		alignSelf:"center",

	},

	glassWrapper: {
		// display:"flex",
		// flexDirection:"column",
		height:"90%",
		width:"50%",
		alignItems: "center",
		flex:1, // places it on top of the background
  	},

	innerContent:{
		flex:1,
		//height:200,
		padding:20,
		alignItems:'center',
		justifyContent: 'center'
	},

    header: {
		height:60,
		//marginTop:20,
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
		gap: 25,
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

	errorText: { color: "#842029", fontSize: 20, textAlign: "center" }
});