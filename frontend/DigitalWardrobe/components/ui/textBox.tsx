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
    width: 438,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FEFDF4",
    paddingHorizontal: 12,

    // iOS shadow
    shadowColor: "#DCA0A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,

    // Android shadow
    elevation: 4,
  },
});