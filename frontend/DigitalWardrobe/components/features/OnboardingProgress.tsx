import { View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";

export default function OnboardingProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleMedium">Step {step} of {total}</Text>
      <ProgressBar progress={step / total} />
    </View>
  );
}