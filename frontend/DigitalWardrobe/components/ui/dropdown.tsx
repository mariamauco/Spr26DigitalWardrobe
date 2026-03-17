import React from "react";
import RNPickerSelect from "react-native-picker-select";
import { StyleSheet, View, ViewStyle, TextStyle, StyleProp } from "react-native";

interface DropdownProps {
  value: string | null;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>; // input style override
  placeholderStyle?: StyleProp<TextStyle>;
  name?: string;
  id?: string;
}

export default function Dropdown({
  value,
  onValueChange,
  items,
  placeholder = "Select an option",
  containerStyle,
  style,
  placeholderStyle,
  name,
  id,
}: DropdownProps) {
  const inputIOS = StyleSheet.flatten([pickerStyles.inputBase, pickerStyles.inputIOS, style]);
  const inputAndroid = StyleSheet.flatten([pickerStyles.inputBase, pickerStyles.inputAndroid, style]);
  const inputWeb = StyleSheet.flatten([pickerStyles.inputBase, pickerStyles.inputWeb, style]);

  return (
    <View style={styles.wrapper}>
      <RNPickerSelect
        value={value}
        onValueChange={onValueChange}
        items={items}
        placeholder={{ label: placeholder, value: null }}
        style={{
          inputIOS,
          inputAndroid,
          inputWeb,
          placeholder: StyleSheet.flatten([pickerStyles.placeholder, placeholderStyle]),
          viewContainer: styles.viewContainer,
        }}
        pickerProps={{}}
        useNativeAndroidPickerStyle={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  viewContainer: {
    width: "100%",
  },
});

const pickerStyles = StyleSheet.create({
  inputBase: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FEFDF4",
    paddingHorizontal: 10,
    color: "#7d7373",
    fontSize: 18,
    fontFamily:'DMSerifDisplay_400Regular',
  },
  inputIOS: {
    shadowColor: "#DCA0A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  inputAndroid: {
    elevation: 4,
  },
  inputWeb: {
    borderWidth: 0,
    shadowColor: "#DCA0A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    fontSize: 18,
  },
  placeholder: {
    color: "#7d7373",
    fontSize: 18,
  },
});