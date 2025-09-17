import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { AuthProvider } from '@/context/authcontext';
import { BudgetProvider } from '@/context/budgetcontext';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  

  return (
    <AuthProvider>
      <BudgetProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}

