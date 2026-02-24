import { Text, View, StyleSheet, TextInput } from 'react-native';
import React, { useState } from "react";
import { Pressable } from "react-native";
import { Alert } from "react-native";

export default function SignUpScreen() {

	const [name, setName] = useState("");
  	const [email, setEmail] = useState("");
  	const [password, setPassword] = useState("");

	const signUp = async () => {

		// check to see if user entered in all values
		if (!name || !email || !password) {
			Alert.alert("Error", "All fields are required");
			return;
		}	

		const payload = {
			name,
			email,
			password
		};

		try {
		const response = await fetch("http://138.197.16.179:5050/", {
			method: "POST",
			headers: {
			"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error("Signup failed");
		}

		const data = await response.json();
    	Alert.alert("Success", "Sign up successful!"); // sends notification to user that signup was succesful

		} 
		catch (error) {
		Alert.alert("Error", "Signup failed. Please try again."); // sends notification to user that signup was NOT succesful
		console.error("Error:", error);
		}
	};

	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>Sign Up</Text>
		</View>

		<View style={{ padding: 3, margin: 5, flex: 4, alignItems: 'center' }}>
				<TextInput placeholder='name' style={styles.input} value={name} onChangeText={setName}/>
				<TextInput placeholder='email' style={styles.input} value={email} onChangeText={setEmail}/>
				<TextInput placeholder='password' style={styles.input} secureTextEntry value={password} onChangeText={setPassword}/>
				<Pressable onPress={signUp}>
					<Text>Sign up</Text>
				</Pressable>
		</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
	},
	input:{
		width:'50%', 
		borderColor:'black', 
		borderWidth:1, 
		margin:3,
		borderRadius:5,
		padding:1,
	}
});