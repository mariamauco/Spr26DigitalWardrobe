import React, { useState } from "react";
import { View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { router } from "expo-router";
import OnboardingProgress from "@/components/features/OnboardingProgress";
import { update } from "./_layout";
import OmbreBackground from "@/components/features/ombrebackground";
import GridOverlay from "@/components/features/gridoverlay";
import CustomButton from "@/components/ui/button";
import List from "@/components/ui/selectableList";

export default function Step1() {
  const [silhouettes, setSilhouettes] = useState<string[]>([]);
  const options = ["Tight", "Oversized", "Cropped", "Structured", "Skirts/Dresses", "Shorts/Pants"];


  const toggle = (item: string) => {
    setSilhouettes((prev) => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const canNext = silhouettes.length > 0;

  const handleNext = async () => {
    if (!canNext) return;

    const data = {
      silhouetteTags: silhouettes,
    };
    
    try {
      await update(data);
      router.push("/onboarding/step2");
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
        <OmbreBackground />
        <GridOverlay />	
      <OnboardingProgress step={1} total={3} />

      <Text variant="headlineSmall">What silhouettes do you prefer?</Text>

      <List 
        options={options} 
        selectedValues={silhouettes} 
        onToggle={toggle} 
      />

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <CustomButton
          title="Next"
          onPress={handleNext}
          disabled={!canNext}
        />
      </View>
    </View>
  );
}