import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Verifying access...
        </Text>
      </View>
    )
  }

  if (!isAdmin) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Access Denied</Text>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          You don't have permission to access the admin area.
        </Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="overview/index"
        options={{
          title: 'Admin Dashboard',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="users/index"
        options={{
          title: 'User Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="phrases/index"
        options={{
          title: 'Phrase Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="moderation/index"
        options={{
          title: 'Content Moderation',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="standards/index"
        options={{
          title: 'Learning Standards',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="guardrails/index"
        options={{
          title: 'Content Guardrails',
          headerShown: true,
        }}
      />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
})
