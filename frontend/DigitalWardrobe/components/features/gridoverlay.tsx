import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";

type Props = {
  xStep?: number;      // spacing between vertical lines
  yStep?: number;      // spacing between horizontal lines
  thickness?: number;  // line thickness
  color?: string;      // line color
};

export default function GridOverlay({
  xStep = 116.36,
  yStep = 138.67,
  thickness = 3,
  color = "rgba(234, 154, 178, 0.10)",
}: Props) {
  const { width, height } = useWindowDimensions();

  const { vCount, hCount } = useMemo(() => {
    // +2 gives a little buffer offscreen so you don't see empty edges
    return {
      vCount: Math.ceil(width / xStep) + 2,
      hCount: Math.ceil(height / yStep) + 2,
    };
  }, [width, height, xStep, yStep]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Vertical lines */}
      {Array.from({ length: vCount }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={{
            position: "absolute",
            left: i * xStep,
            top: 0,
            bottom: 0,
            width: thickness,
            backgroundColor: color,
          }}
        />
      ))}

      {/* Horizontal lines */}
      {Array.from({ length: hCount }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={{
            position: "absolute",
            top: i * yStep,
            left: 0,
            right: 0,
            height: thickness,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}