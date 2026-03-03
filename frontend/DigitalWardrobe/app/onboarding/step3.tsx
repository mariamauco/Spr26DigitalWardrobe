import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import OnboardingProgress from "@/components/features/OnboardingProgress";

export default function Step3() {
  const [comfort, setComfort] = useState(0.5);
  const [experimental, setExperimental] = useState(0.5);

  const finish = async () => {
    // TODO: save onboarding data
    router.replace("/dashboard");
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OnboardingProgress step={3} total={3} />

      <Text variant="headlineSmall">How do you prioritize comfort vs. style?</Text>
      <Slider minimumValue={0} maximumValue={1} value={comfort} onValueChange={setComfort} />

      <Text variant="headlineSmall">How experimental are you with fashion?</Text>
      <Slider minimumValue={0} maximumValue={1} value={experimental} onValueChange={setExperimental} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button mode="outlined" style={{ flex: 1 }} onPress={() => router.back()}>
          Back
        </Button>
        <Button mode="contained" style={{ flex: 1 }} onPress={finish}>
          Finish
        </Button>
      </View>
    </View>
  );
}