import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AccessibilityProvider, useAccessibleColors } from '../contexts/AccessibilityContextSimple';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import '../i18n';

function StackNavigator() {
  const colors = useAccessibleColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/login"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/register"
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/forgot-password"
        options={{
          title: 'Forgot Password',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <StackNavigator />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
