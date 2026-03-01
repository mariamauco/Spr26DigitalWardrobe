import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Button from "../ui/button";

export default function NavBar() {
const router = useRouter();
    
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Wardrobe</Text>

        <Button title="Login" onPress={() => router.replace("/logIn")} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,
    paddingVertical: 4,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 30,
    color: "#8A5F5F",
  },

  button: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(220,160,160,0.89)",
    borderRadius: 999,
  },

  buttonText: {
    fontSize: 20,
    color: "#F2F0F0",
  },

  pressed: {
    opacity: 0.7,
  },
});