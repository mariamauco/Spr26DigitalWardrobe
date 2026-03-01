import { Text, View, StyleSheet, TextInput } from 'react-native';

export default function SignUpScreen() {
    return (
        <>
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>
        </View><View style={{ padding: 3, margin: 5, flex: 4, alignItems: 'center' }}>
                <TextInput id='name' placeholder='name' style={styles.input} />
                <TextInput id='email' placeholder='email' style={styles.input} />
                <TextInput id='password' placeholder='password' style={styles.input} />
                <button id='loginBtn'>Sign Up</button>
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