import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Button from "../ui/button";

export default function NavBar() {
const router = useRouter();
    
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Text style={styles.title}>Digital Wardrobe</Text>

        <Pressable
          style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed
        ]}
        onPress={() => router.push("/login")}
      >
          <Text style={styles.buttonText}>Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    paddingTop: 24,      // space from top
    paddingBottom: 12,
  },

  inner: {
    width: "100%",
    maxWidth: 1200,      // keeps content centered like Figma
    alignSelf: "center",
    paddingHorizontal: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    width: "100%",
    height: 60,
    paddingVertical: 4,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "transparent",
  },

  title: {
    fontSize: 30,
    color: "#8A5F5F",
    fontFamily: "DMSerifDisplay_400Regular",
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
    fontFamily: "DMSerifDisplay_400Regular",
  },

  pressed: {
    opacity: 0.7,
  },
});
