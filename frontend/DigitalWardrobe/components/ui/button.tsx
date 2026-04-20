import React from "react";
import { Pressable, Text, StyleSheet, type TextStyle, type ViewStyle } from "react-native";

type ButtonVariant = "pink" | "white";

export default function Button({
  title,
  onPress,
  variant = "pink",
  disabled = false,
  selected = false,
  buttonStyle,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  selected?: boolean;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.selected : (variant === "white" ? styles.buttonWhite : styles.buttonPink),
        {opacity: disabled ? 0.4 : pressed ? 0.7 : 1},
        buttonStyle,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          variant === "white" ? styles.textWhite : styles.textPink,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 51,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowColor: "rgba(221, 198, 198, 0.75)",
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPink: {
    backgroundColor: "rgba(220, 160, 160, 0.89)",
  },
  buttonWhite: {
    backgroundColor: "#FEFDF4",
    shadowColor: "rgba(214, 187, 187, 0.5)",
    shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
    shadowRadius: 6,
  },
  text: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 24,
    fontWeight: "400",
    letterSpacing:1, // Add letter spacing for better readability
    textShadowColor: "rgba(214, 189, 189, 0.50)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  textPink: {
    color: "white",
    textShadowColor: "rgba(143, 119, 119, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  textWhite: {
    color: "#8A5F5F",
  },
  selected: {
  backgroundColor: "#8A5F5F", // darker / active color
  }
});