import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AccessibilityProvider, useAccessibleColors } from '../contexts/AccessibilityContextSimple';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../i18n';

function StackNavigator() {
  const colors = useAccessibleColors();
  const { t } = useTranslation();

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
      <Stack.Screen
        name="garden/CreateGardenScreen"
        options={{
          title: t('garden.create.title'),
        }}
      />
      <Stack.Screen
        name="garden/[id]"
        options={{
          title: t('garden.detail.title'),
        }}
      />
      <Stack.Screen
        name="forum/[id]"
        options={{
          title: t('forum.post.title') || 'Forum Post',
        }}
      />
      <Stack.Screen
        name="forum/create"
        options={{
          title: t('forum.create.title') || 'Create Post',
        }}
      />
      <Stack.Screen
        name="community/index"
        options={{
          title: t('community.title') || 'Community Members',
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
