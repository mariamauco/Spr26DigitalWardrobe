import React, { FC, ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface PlaceholderCardProps {
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  selected?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
}

const PlaceholderCard: FC<PlaceholderCardProps> = ({
  width = '100%',
  height = 150,
  backgroundColor = '#e0e0e0',
  selected = false,
  style,
  children
}) => {

  const cardColor = selected ? '#bde0fe' : backgroundColor;

  return (
    <View
      style={[
        styles.cardContainer,
        { width, height, backgroundColor: cardColor } as ViewStyle,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  }
});

export default PlaceholderCard;