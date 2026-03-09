import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function OmbreBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base color layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FDECEB" }]} />

      {/* Gradient overlay */}
      <LinearGradient
        colors={[
          "rgba(255,245,245,0.20)",   // 0%
          "rgba(246,243,223,0.90)",   // 100%
        ]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }} // bottom
        end={{ x: 0.5, y: 0 }}   // top
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}