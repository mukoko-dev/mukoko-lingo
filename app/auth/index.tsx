import { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft, ArrowRight, Cloud, Bot, BarChart3 } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { signInWithAuthKit } from '@/lib/auth/workos-client'

export default function AuthScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const styles = createStyles(theme)

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)')
  }

  const handleContinue = async () => {
    setErrorMessage('')
    setLoading(true)
    try {
      const { data, error } = await signInWithAuthKit()
      if (error) throw error
      if (data?.session) {
        router.replace('/(tabs)')
      }
      // A null `data` with no error means the user cancelled the hosted
      // sign-in — stay on this screen, nothing to report.
    } catch (error: any) {
      setErrorMessage(error.message || 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Mukoko Lingo</Text>
            <Text style={styles.subtitle}>Sign in to sync your progress across devices</Text>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Continue</Text>
                <ArrowRight size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Continue without account</Text>
          </TouchableOpacity>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Why create an account?</Text>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: theme.accent + '20' }]}>
                <Cloud size={18} color={theme.accent} />
              </View>
              <Text style={styles.featureText}>Sync progress across devices</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Bot size={18} color={theme.primary} />
              </View>
              <Text style={styles.featureText}>Personalized AI tutoring</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: theme.secondary + '20' }]}>
                <BarChart3 size={18} color={theme.secondary} />
              </View>
              <Text style={styles.featureText}>Track your learning journey</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      backgroundColor: theme.background,
      padding: 24,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    contentWrapper: {
      flex: 1,
      maxWidth: 420,
      width: '100%',
      alignSelf: 'center',
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 16,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 14,
      color: '#B3261E',
      textAlign: 'center',
      marginBottom: 16,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 16,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 32,
    },
    skipText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    features: {
      gap: 16,
    },
    featuresTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 4,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureText: {
      fontSize: 14,
      color: theme.text,
    },
  })
