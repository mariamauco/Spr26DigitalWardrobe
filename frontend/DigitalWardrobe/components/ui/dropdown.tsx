import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown as ElementDropdown } from 'react-native-element-dropdown';

interface DropdownProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  containerStyle?: object;
}

export default function Dropdown({
  value,
  onValueChange,
  items,
  placeholder = "select",
  containerStyle,
} : DropdownProps) {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <ElementDropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        // This is key: it styles the popup window that appears
        containerStyle={styles.popupContainer} 
        itemTextStyle={styles.itemText}
        activeColor="#F5EFE0" // Slight highlight when an item is selected
        data={items}
        // Disable search if the box is too small, or keep it if you prefer
        search={false} 
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          onValueChange(item.value);
          setIsFocus(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#FEFDF4',
    borderRadius: 12,
    height: 55, // Match your TextBox height exactly
    justifyContent: 'center',
    // Match the shadow of your other inputs
    shadowColor: '#DCA0A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdown: {
    height: '100%',
    paddingHorizontal: 12,
  },
  placeholderStyle: {
    fontSize: 18,
    color: '#7d7373', // Use your main text color instead of the muted one
    opacity: 1,       // Force full opacity
    fontFamily: 'DMSerifDisplay_400Regular',
    fontWeight: '400', // Ensure this matches your TextBox exactly
  },
  selectedTextStyle: {
    fontSize: 18,               // Matches TextBox fontSize
    color: '#7d7373',           // Matches TextBox font color
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  popupContainer: {
    borderRadius: 12,
    backgroundColor: '#FEFDF4', // Matches theme
    borderWidth: 0,
    marginTop: 5,
    elevation: 5,
  },
  itemText: {
    color: '#7d7373',           // Matches theme text
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
  },
});