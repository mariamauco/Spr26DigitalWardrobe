import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

interface TextBoxProps extends TextInputProps {}

export default function TextBox({ style, ...props }: TextBoxProps) {
  return (
    <TextInput
      style={[styles.textBox, style]} // allows external overrides
      placeholderTextColor="#7d7373"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textBox: {
    width: "72%",
    height: 55, // Set a consistent height
    borderRadius: 12,
    backgroundColor: "#FEFDF4",
    
    // 1. HORIZONTAL ALIGNMENT
    textAlign: 'left',          // Keep text to the left
    paddingLeft: 20,            // Push text away from the edge (Crucial!)
    
    // 2. VERTICAL ALIGNMENT
    textAlignVertical: 'center', // Centers text vertically on Android
    paddingVertical: 0,          // Removes default OS padding
    
    // 3. TYPOGRAPHY
    fontSize: 18,
    fontFamily: 'DMSerifDisplay_400Regular',

    // 4. SHADOWS
    shadowColor: "#DCA0A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});