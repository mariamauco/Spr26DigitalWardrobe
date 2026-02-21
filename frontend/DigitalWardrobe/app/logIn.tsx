import { TextInput ,Text, View, StyleSheet } from 'react-native';


export default function LogInScreen() {
	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>Log In</Text>
		</View>
		<View style={{padding:3, margin:5, flex:4, alignItems:'center'}}>
			<TextInput id='email' placeholder='email' style={styles.input}/>
			<TextInput id='password' placeholder='password' style={styles.input}/>
			<button id='loginBtn'>Login</button>
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