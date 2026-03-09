import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useFonts, DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";

import { useColorScheme } from '@/hooks/use-color-scheme';



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack initialRouteName="landing">
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="logIn" options={{ title: 'Log In' }} />
        <Stack.Screen name="signUp" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
