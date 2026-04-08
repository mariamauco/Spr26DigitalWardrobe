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

export default function Step2() {
  const [styles, setStyles] = useState<string[]>([]);
  const options = ["Y2K", "Business Casual", "Vintage", "Streetwear", "Minimalist", "Alternative"];

  const toggle = (item: string) => {
    setStyles((prev) => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const canNext = styles.length > 0;

    const handleNext = async () => {
      if (!canNext) return;

      const data = {
        styleTags: styles,
      };
        
      try {
        await update(data);
        router.push("/onboarding/step3");
      } catch (error) {
        console.error("Failed to update preferences:", error);
      }
    };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OmbreBackground />
      <GridOverlay />
        <OnboardingProgress step={2} total={3} />

        <Text variant="headlineSmall">What style describes you best?</Text>

        <List 
          options={options} 
          selectedValues={styles} 
          onToggle={toggle} 
        />

      {/*Buttons*/}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 }}>
          <CustomButton
            title="Back"
            onPress={() => router.back()}
            variant="white"
          />

          <CustomButton
            title="Next"
            onPress={handleNext}
            disabled={!canNext}
            variant="pink"
          />
        </View>
    </View>
  );
}