import React, { useState } from "react";
import { View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";
import { router } from "expo-router";
import OnboardingProgress from "@/components/features/OnboardingProgress";
import { update } from "./_layout";

export default function Step2() {
  const [styles, setStyles] = useState<string[]>([]);
  const options = ["Y2K", "Business Casual", "Vintage", "Streetwear", "Minimalist", "Alternative"];

  const toggle = (item: string) => {
    setStyles((prev) => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const canNext = styles.length > 0;

    const handleNext = async () => {
      const data = {
        styleTags: styles,
      };
  
      await update(data);
      router.push("/onboarding/step3");
      
    };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <OnboardingProgress step={2} total={3} />

      <Text variant="headlineSmall">What style describes you best?</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} selected={styles.includes(o)} onPress={() => toggle(o)}>
            {o}
          </Chip>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button mode="outlined" style={{ flex: 1 }} onPress={() => router.back()}>
          Back
        </Button>
        <Button
          mode="contained"
          style={{ flex: 1 }}
          disabled={!canNext}
          onPress={handleNext}
        >
          Next
        </Button>
      </View>
    </View>
  );
}