import { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Cloud, Bot, BarChart3 } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { signInWithEmail, signUpWithEmail, signOut } from '@/lib/supabase/client'

export default function AuthScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const { width } = useWindowDimensions()

  // Responsive breakpoints
  const isTablet = width >= 768

  const styles = createStyles(theme, isTablet)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)
    setStatusMessage(isLogin ? 'Signing in...' : 'Creating account...')

    try {
      if (isLogin) {
        const { data, error } = await signInWithEmail(email, password)
        if (error) throw error

        // Verify we actually got a session
        if (!data?.session) {
          throw new Error('Sign in failed. Please check your credentials and try again.')
        }

        // Check if email has been verified
        if (data.user && !data.user.email_confirmed_at) {
          // Sign out to clear the unverified session
          await signOut()
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.')
        }

        setStatusMessage('Success! Redirecting...')

        // Small delay to show success message and let auth state propagate
        await new Promise(resolve => setTimeout(resolve, 500))

        router.replace('/(tabs)')
      } else {
        const { data, error } = await signUpWithEmail(email, password)
        if (error) throw error

        setLoading(false)
        setStatusMessage('')

        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          Alert.alert(
            'Check Your Email',
            'We sent you a verification link. Please check your email and click the link to activate your account.',
            [{ text: 'OK', onPress: () => setIsLogin(true) }]
          )
        } else if (data?.session) {
          // Auto-confirmed - redirect
          setStatusMessage('Account created! Redirecting...')
          await new Promise(resolve => setTimeout(resolve, 500))
          router.replace('/(tabs)')
        } else {
          throw new Error('Account creation failed. Please try again.')
        }
      }
    } catch (error: any) {
      setStatusMessage('')
      Alert.alert('Error', error.message || 'Authentication failed')
    } finally {
      setLoading(false)
      setStatusMessage('')
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.contentWrapper}>
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/nyuchi-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Nyuchi Lingo</Text>
              <Text style={styles.subtitle}>
                Learn African Languages with AI
              </Text>
            </View>

            {/* Auth Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Mail size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirm Password (Sign Up only) */}
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </View>
              )}

              {/* Forgot Password (Sign In only) */}
              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push('/auth/forgot-password' as any)}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Toggle Auth Mode */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.toggleText}>
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Continue without account</Text>
            </TouchableOpacity>

            {/* Features */}
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Why create an account?</Text>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: Colors.accent[600] + '20' }]}>
                  <Cloud size={18} color={Colors.accent[600]} />
                </View>
                <Text style={styles.featureText}>Sync progress across devices</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: Colors.primary[600] + '20' }]}>
                  <Bot size={18} color={Colors.primary[600]} />
                </View>
                <Text style={styles.featureText}>Personalized AI tutoring</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: Colors.secondary[800] + '20' }]}>
                  <BarChart3 size={18} color={Colors.secondary[800]} />
                </View>
                <Text style={styles.featureText}>Track your learning journey</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const createStyles = (theme: typeof lightTheme, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flexGrow: 1,
      padding: 24,
      paddingTop: 60,
    },
    contentWrapper: {
      maxWidth: isTablet ? 450 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    backButton: {
      position: 'absolute',
      top: 60,
      left: 24,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: isTablet ? 40 : 20,
    },
    logo: {
      width: isTablet ? 80 : 64,
      height: isTablet ? 80 : 64,
      marginBottom: 12,
    },
    title: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: isTablet ? 18 : 16,
      color: theme.textSecondary,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      fontSize: isTablet ? 24 : 22,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 24,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.text,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary[600],
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 8,
      gap: 8,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '600',
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 8,
    },
    forgotPasswordText: {
      color: Colors.primary[600],
      fontSize: 14,
    },
    toggleButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    toggleText: {
      color: Colors.primary[600],
      fontSize: 15,
    },
    skipButton: {
      alignItems: 'center',
      marginBottom: 32,
    },
    skipText: {
      color: theme.textMuted,
      fontSize: 15,
      textDecorationLine: 'underline',
    },
    features: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featuresTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    featureIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
    },
  })
