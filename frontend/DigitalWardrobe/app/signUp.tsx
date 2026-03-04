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
import GlassPanel from "../components/ui/glassPanel";

// when sign up button is pressed this function is called
// sends user info to backend
export default function SignUpScreen() {

	const [name, setName] = useState("");
  	const [email, setEmail] = useState("");
  	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [zipCode, setZipCode] = useState<string>("");
	const [country, setCountry] = useState<string | null>(null);
	const countries = [
		{ label: "Afghanistan", value: "AF" },
		{ label: "Albania", value: "AL" },
		{ label: "Algeria", value: "DZ" },
		{ label: "Andorra", value: "AD" },
		{ label: "Angola", value: "AO" },
		{ label: "Antigua and Barbuda", value: "AG" },
		{ label: "Argentina", value: "AR" },
		{ label: "Armenia", value: "AM" },
		{ label: "Australia", value: "AU" },
		{ label: "Austria", value: "AT" },
		{ label: "Azerbaijan", value: "AZ" },
		{ label: "Bahamas", value: "BS" },
		{ label: "Bahrain", value: "BH" },
		{ label: "Bangladesh", value: "BD" },
		{ label: "Barbados", value: "BB" },
		{ label: "Belarus", value: "BY" },
		{ label: "Belgium", value: "BE" },
		{ label: "Belize", value: "BZ" },
		{ label: "Benin", value: "BJ" },
		{ label: "Bhutan", value: "BT" },
		{ label: "Bolivia", value: "BO" },
		{ label: "Bosnia and Herzegovina", value: "BA" },
		{ label: "Botswana", value: "BW" },
		{ label: "Brazil", value: "BR" },
		{ label: "Brunei", value: "BN" },
		{ label: "Bulgaria", value: "BG" },
		{ label: "Burkina Faso", value: "BF" },
		{ label: "Burundi", value: "BI" },
		{ label: "Cambodia", value: "KH" },
		{ label: "Cameroon", value: "CM" },
		{ label: "Canada", value: "CA" },
		{ label: "Cape Verde", value: "CV" },
		{ label: "Central African Republic", value: "CF" },
		{ label: "Chad", value: "TD" },
		{ label: "Chile", value: "CL" },
		{ label: "China", value: "CN" },
		{ label: "Colombia", value: "CO" },
		{ label: "Comoros", value: "KM" },
		{ label: "Congo (Republic)", value: "CG" },
		{ label: "Congo (Democratic Republic)", value: "CD" },
		{ label: "Costa Rica", value: "CR" },
		{ label: "Croatia", value: "HR" },
		{ label: "Cuba", value: "CU" },
		{ label: "Cyprus", value: "CY" },
		{ label: "Czech Republic", value: "CZ" },
		{ label: "Denmark", value: "DK" },
		{ label: "Djibouti", value: "DJ" },
		{ label: "Dominica", value: "DM" },
		{ label: "Dominican Republic", value: "DO" },
		{ label: "Ecuador", value: "EC" },
		{ label: "Egypt", value: "EG" },
		{ label: "El Salvador", value: "SV" },
		{ label: "Equatorial Guinea", value: "GQ" },
		{ label: "Eritrea", value: "ER" },
		{ label: "Estonia", value: "EE" },
		{ label: "Eswatini", value: "SZ" },
		{ label: "Ethiopia", value: "ET" },
		{ label: "Fiji", value: "FJ" },
		{ label: "Finland", value: "FI" },
		{ label: "France", value: "FR" },
		{ label: "Gabon", value: "GA" },
		{ label: "Gambia", value: "GM" },
		{ label: "Georgia", value: "GE" },
		{ label: "Germany", value: "DE" },
		{ label: "Ghana", value: "GH" },
		{ label: "Greece", value: "GR" },
		{ label: "Grenada", value: "GD" },
		{ label: "Guatemala", value: "GT" },
		{ label: "Guinea", value: "GN" },
		{ label: "Guinea-Bissau", value: "GW" },
		{ label: "Guyana", value: "GY" },
		{ label: "Haiti", value: "HT" },
		{ label: "Honduras", value: "HN" },
		{ label: "Hungary", value: "HU" },
		{ label: "Iceland", value: "IS" },
		{ label: "India", value: "IN" },
		{ label: "Indonesia", value: "ID" },
		{ label: "Iran", value: "IR" },
		{ label: "Iraq", value: "IQ" },
		{ label: "Ireland", value: "IE" },
		{ label: "Israel", value: "IL" },
		{ label: "Italy", value: "IT" },
		{ label: "Jamaica", value: "JM" },
		{ label: "Japan", value: "JP" },
		{ label: "Jordan", value: "JO" },
		{ label: "Kazakhstan", value: "KZ" },
		{ label: "Kenya", value: "KE" },
		{ label: "Kiribati", value: "KI" },
		{ label: "Kuwait", value: "KW" },
		{ label: "Kyrgyzstan", value: "KG" },
		{ label: "Laos", value: "LA" },
		{ label: "Latvia", value: "LV" },
		{ label: "Lebanon", value: "LB" },
		{ label: "Lesotho", value: "LS" },
		{ label: "Liberia", value: "LR" },
		{ label: "Libya", value: "LY" },
		{ label: "Liechtenstein", value: "LI" },
		{ label: "Lithuania", value: "LT" },
		{ label: "Luxembourg", value: "LU" },
		{ label: "Madagascar", value: "MG" },
		{ label: "Malawi", value: "MW" },
		{ label: "Malaysia", value: "MY" },
		{ label: "Maldives", value: "MV" },
		{ label: "Mali", value: "ML" },
		{ label: "Malta", value: "MT" },
		{ label: "Marshall Islands", value: "MH" },
		{ label: "Mauritania", value: "MR" },
		{ label: "Mauritius", value: "MU" },
		{ label: "Mexico", value: "MX" },
		{ label: "Micronesia", value: "FM" },
		{ label: "Moldova", value: "MD" },
		{ label: "Monaco", value: "MC" },
		{ label: "Mongolia", value: "MN" },
		{ label: "Montenegro", value: "ME" },
		{ label: "Morocco", value: "MA" },
		{ label: "Mozambique", value: "MZ" },
		{ label: "Myanmar", value: "MM" },
		{ label: "Namibia", value: "NA" },
		{ label: "Nauru", value: "NR" },
		{ label: "Nepal", value: "NP" },
		{ label: "Netherlands", value: "NL" },
		{ label: "New Zealand", value: "NZ" },
		{ label: "Nicaragua", value: "NI" },
		{ label: "Niger", value: "NE" },
		{ label: "Nigeria", value: "NG" },
		{ label: "North Korea", value: "KP" },
		{ label: "North Macedonia", value: "MK" },
		{ label: "Norway", value: "NO" },
		{ label: "Oman", value: "OM" },
		{ label: "Pakistan", value: "PK" },
		{ label: "Palau", value: "PW" },
		{ label: "Panama", value: "PA" },
		{ label: "Papua New Guinea", value: "PG" },
		{ label: "Paraguay", value: "PY" },
		{ label: "Peru", value: "PE" },
		{ label: "Philippines", value: "PH" },
		{ label: "Poland", value: "PL" },
		{ label: "Portugal", value: "PT" },
		{ label: "Qatar", value: "QA" },
		{ label: "Romania", value: "RO" },
		{ label: "Russia", value: "RU" },
		{ label: "Rwanda", value: "RW" },
		{ label: "Saint Kitts and Nevis", value: "KN" },
		{ label: "Saint Lucia", value: "LC" },
		{ label: "Saint Vincent and the Grenadines", value: "VC" },
		{ label: "Samoa", value: "WS" },
		{ label: "San Marino", value: "SM" },
		{ label: "Saudi Arabia", value: "SA" },
		{ label: "Senegal", value: "SN" },
		{ label: "Serbia", value: "RS" },
		{ label: "Seychelles", value: "SC" },
		{ label: "Sierra Leone", value: "SL" },
		{ label: "Singapore", value: "SG" },
		{ label: "Slovakia", value: "SK" },
		{ label: "Slovenia", value: "SI" },
		{ label: "Solomon Islands", value: "SB" },
		{ label: "Somalia", value: "SO" },
		{ label: "South Africa", value: "ZA" },
		{ label: "South Korea", value: "KR" },
		{ label: "South Sudan", value: "SS" },
		{ label: "Spain", value: "ES" },
		{ label: "Sri Lanka", value: "LK" },
		{ label: "Sudan", value: "SD" },
		{ label: "Suriname", value: "SR" },
		{ label: "Sweden", value: "SE" },
		{ label: "Switzerland", value: "CH" },
		{ label: "Syria", value: "SY" },
		{ label: "Taiwan", value: "TW" },
		{ label: "Tajikistan", value: "TJ" },
		{ label: "Tanzania", value: "TZ" },
		{ label: "Thailand", value: "TH" },
		{ label: "Togo", value: "TG" },
		{ label: "Tonga", value: "TO" },
		{ label: "Trinidad and Tobago", value: "TT" },
		{ label: "Tunisia", value: "TN" },
		{ label: "Turkey", value: "TR" },
		{ label: "Turkmenistan", value: "TM" },
		{ label: "Tuvalu", value: "TV" },
		{ label: "Uganda", value: "UG" },
		{ label: "Ukraine", value: "UA" },
		{ label: "United Arab Emirates", value: "AE" },
		{ label: "United Kingdom", value: "GB" },
		{ label: "United States", value: "US" },
		{ label: "Uruguay", value: "UY" },
		{ label: "Uzbekistan", value: "UZ" },
		{ label: "Vanuatu", value: "VU" },
		{ label: "Vatican City", value: "VA" },
		{ label: "Venezuela", value: "VE" },
		{ label: "Vietnam", value: "VN" },
		{ label: "Yemen", value: "YE" },
		{ label: "Zambia", value: "ZM" },
		{ label: "Zimbabwe", value: "ZW" },
	];

	const router = useRouter();

	const signUp = async () => {

		console.log("SIGNUP FUNCTION CALLED");

		// check to see if user entered in all values
		if (!name || !email || !password || !zipCode || !country) {
			Alert.alert("Error", "All fields are required");
			return;
		}	

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

      	console.log("Status:", response.status);

		const data = await response.json();
		console.log("Response:", data);

		// this alert is not triggering ;-; the status is 201 when logged
		if (response.status === 201) {
			Alert.alert("Success", "Sign up successful!",
				[
					{ 
						text: "OK", 
						onPress: () => router.replace("../onboarding")
					}
				]
			);
			router.replace("../onboarding"); // added this to get rerouted since alert doesnt happen
			return;
		} else {
			Alert.alert("SignUp Failed", data.message || "Invalid credentials");
			return;
		}
		} 
		catch (error) {
		Alert.alert("Error", "Signup failed. Please try again.");
		console.error("Error:", error);
		}
	};

	return (
		<>
		<View style={styles.mainContainer}>
			<OmbreBackground />
			<GridOverlay />
			
			<View style={styles.glassWrapper}>
				<GlassPanel />
			</View>

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
								onChangeText={setName}
							/>
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
							<TextBox 
								placeholder='retype password' 
								secureTextEntry 
								value={confirmPassword} 
								onChangeText={setConfirmPassword}
							/>
							<TextBox 
								placeholder='zip code' 
								value={zipCode} 
								onChangeText={setZipCode}
							/>
							
							<View style={styles.pickerWrapper}>
								<Dropdown
									value={country}
									onValueChange={setCountry}
									items={countries}
									placeholder="Select a country"
								/>
							</View>
							
							<Button title="Sign up" onPress={signUp} />
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
	glassWrapper: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		justifyContent: "center",
		alignItems: "center",
		zIndex: -1, // middle layer
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