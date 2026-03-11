import React, { useState } from "react";
import { View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";
import { router } from "expo-router";
import OnboardingProgress from "@/components/features/OnboardingProgress";
import { update } from "./_layout";

export default function Step1() {
  const [silhouettes, setSilhouettes] = useState<string[]>([]);
  const options = ["Tight", "Oversized", "Cropped", "Structured", "Skirts/Dresses", "Shorts/Pants"];


  const toggle = (item: string) => {
    setSilhouettes((prev) => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const canNext = silhouettes.length > 0;

  const handleNext = async () => {
    const data = {
      silhouetteTags: silhouettes,
    };

    await update(data);
    router.push("/onboarding/step2");
    
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OnboardingProgress step={1} total={3} />

      <Text variant="headlineSmall">What silhouettes do you prefer?</Text>

      <View style={{ gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} selected={silhouettes.includes(o)} onPress={() => toggle(o)}>
            {o}
          </Chip>
        ))}
      </View>

      <Button mode="contained" disabled={!canNext} onPress={handleNext}>
        Next
      </Button>
    </View>
  );
}