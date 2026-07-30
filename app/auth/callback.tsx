import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native'
import { useRouter, Stack, useLocalSearchParams } from 'expo-router'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { handleAuthCallback } from '@/lib/auth/workos-client'

/**
 * Auth Callback Page
 *
 * Fallback handler for the WorkOS AuthKit redirect when it arrives as a
 * cold-start deep link rather than resolving `openAuthSessionAsync`
 * directly (e.g. the in-app browser sheet was dismissed by the OS).
 *
 * URL pattern: /auth/callback?code=<authorization_code>&state=<state>
 */
export default function AuthCallbackScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string; error_description?: string }>()

  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const { code } = params
      if (!code) {
        setStatus('error')
        setErrorMessage('No authorization code found. Please try signing in again.')
        setTimeout(() => router.replace('/auth'), 3000)
        return
      }

      try {
        const query = new URLSearchParams(params as Record<string, string>).toString()
        const { data, error } = await handleAuthCallback(`mukokolingo://auth/callback?${query}`)

        if (error) throw error

        if (data?.session) {
          router.replace('/(tabs)')
        } else {
          throw new Error('Authentication failed. Please try again.')
        }
      } catch (error: any) {
        setStatus('error')
        setErrorMessage(error.message || 'Authentication failed. The link may have expired.')
        setTimeout(() => router.replace('/auth'), 3000)
      }
    }

    handleCallback()
  }, [params.code])

  const styles = createStyles(theme)

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {status === 'loading' ? (
          <View style={styles.content}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.title}>Authenticating...</Text>
            <Text style={styles.subtitle}>Please wait while we verify your identity</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.errorTitle}>Authentication Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Text style={styles.redirectText}>Redirecting to sign in...</Text>
          </View>
        )}
      </View>
    </>
  )
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginTop: 24,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 22,
    },
    redirectText: {
      fontSize: 14,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
  })
