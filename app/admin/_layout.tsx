import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { ShieldX, ArrowLeft, LogIn, Home } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAuthenticated(false)
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

  // Not authenticated - prompt to sign in
  if (!isAuthenticated) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.accent[500] + '20' }]}>
          <LogIn size={48} color={Colors.accent[500]} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Sign In Required</Text>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Please sign in to access the admin area.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary[600] }]}
            onPress={() => router.replace('/auth')}
          >
            <LogIn size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={20} color={theme.text} />
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Authenticated but not admin
  if (!isAdmin) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.accent[500] + '20' }]}>
          <ShieldX size={48} color={Colors.accent[500]} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Access Denied</Text>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          You don't have permission to access the admin area.{'\n'}
          Contact an administrator if you believe this is an error.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary[600] }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Go Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={theme.text} />
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})
