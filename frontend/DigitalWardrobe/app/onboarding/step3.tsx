import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import OnboardingProgress from "@/components/features/OnboardingProgress";
import { update } from "./_layout";

export default function Step3() {
  const [comfort, setComfort] = useState(0.5);
  const [experimental, setExperimental] = useState(0.5);

  const handleFinish = async () => {
    // save onboarding data
    const data = {
      comfort: comfort*10,
      experimental: experimental*10,
      completed: true,
    };

    console.log(data);

    await update(data);

    // route them to dashboard
    router.replace("/dashboard");


  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OnboardingProgress step={3} total={3} />

      <Text variant="headlineSmall">How do you prioritize comfort vs. style?</Text>
      <Slider minimumValue={0} maximumValue={1} value={comfort} onValueChange={(value) => setComfort(value)} />

      <Text variant="headlineSmall">How experimental are you with fashion?</Text>
      <Slider minimumValue={0} maximumValue={1} value={experimental} onValueChange={(value) => setExperimental(value)} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button mode="outlined" style={{ flex: 1 }} onPress={() => router.back()}>
          Back
        </Button>
        <Button mode="contained" style={{ flex: 1 }} onPress={handleFinish}>
          Finish
        </Button>
      </View>
    </View>
  );
}