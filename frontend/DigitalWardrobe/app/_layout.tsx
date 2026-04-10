import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from "../components/features/userContext";
import 'react-native-reanimated';

import {
  useFonts,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
import { EncodeSansSemiCondensed_400Regular } from "@expo-google-fonts/encode-sans-semi-condensed";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";



import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
const [fontsLoaded] = useFonts({
  DMSerifDisplay_400Regular,
  EncodeSansSemiCondensed_400Regular,
  PlusJakartaSans_700Bold,
});

  if (!fontsLoaded) return null;

  return (
    <UserProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack initialRouteName="landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="landing" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="logIn" />
          <Stack.Screen name="signUp" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name= "privacy" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}