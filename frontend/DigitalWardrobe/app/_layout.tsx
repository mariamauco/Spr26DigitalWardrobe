import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="landing">
        <Stack.Screen name="landing" options={{ title: 'Landing' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="logIn" options={{ title: 'Log In' }} />
        <Stack.Screen name="signUp" options={{ title: 'Sign Up' }} />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
