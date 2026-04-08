import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import OnboardingProgress from "@/components/features/OnboardingProgress";
import { update } from "./_layout";
import OmbreBackground from "@/components/features/ombrebackground";
import GridOverlay from "@/components/features/gridoverlay";
import CustomButton from "@/components/ui/button";

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

    await update(data);

    // route them to dashboard
    router.replace("/dashboard");
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OmbreBackground />
      <GridOverlay />
      <OnboardingProgress step={3} total={3} />

      <Text variant="headlineSmall">How do you prioritize comfort vs. style?</Text>
      <Slider minimumValue={0} maximumValue={1} value={comfort} onValueChange={(value) => setComfort(value)} />

      <Text variant="headlineSmall">How experimental are you with fashion?</Text>
      <Slider minimumValue={0} maximumValue={1} value={experimental} onValueChange={(value) => setExperimental(value)} />

      {/*Buttons*/}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 }}>
          <CustomButton
            title="Back"
            onPress={() => router.back()}
            variant="white"
          />

          <CustomButton
            title="Next"
            onPress={handleFinish}
            variant="pink"
          />
        </View>

      </View>
  );
}