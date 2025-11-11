import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { GlobalAccessibilityToggle } from '../../components/GlobalAccessibilityToggle';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading]);

  if (loading) return null;
  if (!user) return null;
  return <>{children}</>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('layout.home'),
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('layout.profile'),
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="gardens"
          options={{
            title: t('layout.gardens'),
            tabBarIcon: ({ color }) => <FontAwesome name="leaf" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="forum"
          options={{
            title: t('layout.forum'),
            tabBarIcon: ({ color }) => <FontAwesome name="comments" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('layout.messages'),
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-tasks"
          options={{
            title: t('layout.myTasks'),
            tabBarIcon: ({ color }) => <FontAwesome name="tasks" size={24} color={color} />,
          }}
        />
      </Tabs>
      <GlobalAccessibilityToggle />
    </AuthGate>
  );
}
