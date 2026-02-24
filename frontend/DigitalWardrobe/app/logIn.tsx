import { TextInput ,Text, View, StyleSheet } from 'react-native';
import React, { useState } from "react";
import { Pressable } from "react-native";
import { Alert } from "react-native";

export default function LogInScreen() {

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");	

	const login = async () => {

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
		const response = await fetch("http://138.197.16.179:5050/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		});

		if (!response.ok) {
		throw new Error("Login failed");
		}

		const data = await response.json();
		Alert.alert("Success", "Login successful!"); // sends notification to user that login was succesful

		} catch (error) {
		Alert.alert("Error", "Signup failed. Please try again."); // sends notification to user that login was NOT succesful
		console.error("Error:", error);
		}
	};
	
	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>Log In</Text>
		</View>
		<View style={{padding:3, margin:5, flex:4, alignItems:'center'}}>
			<TextInput placeholder='email' style={styles.input} value={email} onChangeText={setEmail}/>
			<TextInput placeholder='password' style={styles.input} secureTextEntry value={password} onChangeText={setPassword}/>
			<Pressable onPress={login}>
				<Text>Log In</Text>
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