import React from 'react'
import { Tabs } from 'expo-router'
import { BookOpen, MessageCircle, Target, User } from 'lucide-react-native'

import { lightTheme, darkTheme } from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          headerTitle: 'Nyuchi Lingo',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-practice"
        options={{
          title: 'Shamwari',
          headerTitle: 'AI Practice',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          headerTitle: 'My Skills',
          tabBarIcon: ({ color, size }) => (
            <Target size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
