import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from "../components/features/userContext";
import 'react-native-reanimated';

import { useFonts, DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { EncodeSansSemiCondensed_400Regular } from "@expo-google-fonts/encode-sans-semi-condensed";

import { useColorScheme } from '@/hooks/use-color-scheme';



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    EncodeSansSemiCondensed_400Regular
  });

  if (!fontsLoaded) 
    return null;

  return (
    <UserProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack initialRouteName="landing">
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false, title: "Dashboard" }} />
          <Stack.Screen name="login" options={{ title: "Log In" }} />
          <Stack.Screen name="signUp" options={{ headerShown: false, title: "Sign Up" }} />
          <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
        </Stack>
    
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}
