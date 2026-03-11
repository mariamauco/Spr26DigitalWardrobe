import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

export default function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.button, 
        { opacity: pressed ? 0.7 : 1 } // Adds a nice "fade" effect when tapped
      ]} 
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 221,
    height: 51,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRadius: 999,
    backgroundColor: "rgba(220, 160, 160, 0.89)",
    shadowColor: "rgba(214, 189, 189, 0.75)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6, 
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "black",
    fontSize: 16,
    fontWeight: "500", // Added a bit of weight to make it look like a button
  },
});