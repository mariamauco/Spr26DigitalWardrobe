import React from "react";
import { View, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";

interface SelectableListProps {
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

const SelectableList = ({ options, selectedValues, onToggle }: SelectableListProps) => {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option);

        return (
          <Chip
            key={option}
            selected={isSelected}
            onPress={() => onToggle(option)}
            style={styles.chip}
            selectedColor="#e8badb" 
            textStyle={styles.chipText}
            showSelectedCheck={false}
            // 1. Changed 'selectedIcon' to 'icon'
            // 2. We pass the icon name only if selected
            icon={isSelected ? "check" : undefined}
          >
            {option}
          </Chip>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: "100%",
  },
  chip: {
    paddingVertical: 4,
    backgroundColor: "#FFFBF0",
    borderRadius: 8,
  },
  chipText: {
    color: "#534047",
    fontSize: 16,
    fontWeight: "400", 
    fontFamily: "DMSerifDisplay_400Regular",
  },
});
export default SelectableList;