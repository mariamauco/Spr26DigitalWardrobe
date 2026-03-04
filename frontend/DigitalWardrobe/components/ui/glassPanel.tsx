import React from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

// creates glass effect Panel
export default function GlassPanel() {
  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="default" style={styles.blur} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 524,
    height: 579,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 33,
    overflow: "hidden", // required for blur + border radius
    backgroundColor: "rgba(220, 160, 160, 0.5)",
  },
  blur: {
    flex: 1,
  },
});