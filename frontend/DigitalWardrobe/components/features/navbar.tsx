import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function NavBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Wardrobe</Text>

      <Pressable style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Log In</Text>
      </Pressable>
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
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    color: "#8A5F5F",
  },
  button: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(220,160,160,0.89)",
    borderRadius: 999,
  },
  buttonText: {
    fontSize: 20,
    color: "#F2F0F0",
  },
});
