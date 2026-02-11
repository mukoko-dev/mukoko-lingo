import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs, useRouter } from 'expo-router'
import { BookOpen, MessageCircle, Target, User, BarChart3 } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { lightTheme, darkTheme } from '@/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'
import { AppHeader } from '@/components/AppHeader'
import { useAuth } from '@/app/_layout'
import { signOut } from '@/lib/supabase/client'

const ONBOARDING_KEY = '@mukoko_onboarding_complete'

export default function TabLayout() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleLogout = async () => {
    // Sign out the Supabase session
    await signOut()
    // Clear onboarding status so user sees welcome on next visit
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY)
    } catch (error) {
      console.error('Error clearing onboarding status:', error)
    }
    router.replace('/welcome')
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Shared header */}
      <AppHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
          // Hide the default header since we use AppHeader
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-practice"
          options={{
            title: 'Shamwari',
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, size }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            title: 'Skills',
            tabBarIcon: ({ color, size }) => (
              <Target size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
