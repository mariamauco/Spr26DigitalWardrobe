import React from "react";
import RNPickerSelect from "react-native-picker-select";
import { StyleSheet, View } from "react-native";

interface DropdownProps {
  value: string | null;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
}

export default function Dropdown({
  value,
  onValueChange,
  items,
  placeholder = "Select an option",
}: DropdownProps) {
  return (
    <View style={styles.wrapper}>
      <RNPickerSelect
        value={value}
        onValueChange={onValueChange}
        items={items}
        placeholder={{ label: placeholder, value: null }}
        style={pickerStyles}
        useNativeAndroidPickerStyle={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "85%",
  },
});

const pickerStyles = {
  inputIOS: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FEFDF4",
    paddingHorizontal: 12,

    // iOS shadow
    shadowColor: "#DCA0A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  inputAndroid: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FEFDF4",
    paddingHorizontal: 12,
    elevation: 4, // Android shadow
  },
  placeholder: {
    color: "#999",
  },
};