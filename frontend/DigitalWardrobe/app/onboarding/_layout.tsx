import { Stack } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const update = async (data: Record<string, unknown>) => {
  let response;
  // sends what the user puts in onboarding to backend
  try {
    response = await fetch(`${API_URL}/api/onboarding`, {
      method: 'POST', // sending to backend
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(error);
  }
  console.log(response);
};

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}