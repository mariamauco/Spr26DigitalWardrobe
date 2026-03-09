import { Stack } from "expo-router";

export const update = async (data: Record<string, unknown>) => {
  let response;
  try {
    response = await fetch('http://localhost:5050/api/onboarding', {
      method: 'POST',
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