import { TextInput, Text, View, StyleSheet } from 'react-native';

export default function DashboardScreen() {
	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>Dashboard</Text>
		</View>
		<View style={{padding:3, margin:5, flex:4, alignItems:'center'}}>
			<Text>Upload clothing item</Text>
			<TextInput id='name' placeholder='name' style={styles.input}/>
			<select id="type" style={styles.input}>
				<option value="top">top</option>
				<option value="bottom">bottom</option>
				<option value="outerwear">outerwear</option>
				<option value="dress">dress</option>
				<option value="shoes">shoes</option>
				<option value="accessory">accessory</option>
			</select>
			<TextInput id='colors' placeholder='colors (comma) e.g. blue,white' style={styles.input}/>
			<TextInput id='colors' placeholder='tags (comma) e.g. casual,winter' style={styles.input}/>
			<input id='image' type='file' accept='image/*' style={styles.input}/>
			<button id="uploadBtn" style={styles.input}>Upload</button>
		</View>
		<View style={{padding:3, margin:5, flex:6, alignItems:'center'}}>
			<Text>Your items</Text>
			<View className='row'>
				<button id='refreshBtn'>Refresh</button>
				<div id="items"></div>
			</View>
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