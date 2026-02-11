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
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { resetPasswordForEmail } from '@/lib/auth/stytch-client'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const styles = createStyles(theme, isTablet)

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPasswordForEmail(email)
      if (error) throw error
      setEmailSent(true)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (emailSent) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={64} color={Colors.secondary[500]} />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.successSubtext}>
              Click the link in the email to reset your password.{'\n'}
              If you don't see it, check your spam folder.
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleBack}
            >
              <Text style={styles.submitButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false)
                handleResetPassword()
              }}
            >
              <Text style={styles.resendText}>Didn't receive email? Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    )
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
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you a reset link.
              </Text>
            </View>

            {/* Reset Card */}
            <View style={styles.card}>
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
                  autoFocus
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Send Reset Link</Text>
                    <Send size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Back to Sign In */}
              <TouchableOpacity
                style={styles.backToSignIn}
                onPress={handleBack}
              >
                <Text style={styles.backToSignInText}>
                  Remember your password? Sign in
                </Text>
              </TouchableOpacity>
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isTablet ? 18 : 16,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
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
    backToSignIn: {
      alignItems: 'center',
      marginTop: 16,
    },
    backToSignInText: {
      color: Colors.primary[600],
      fontSize: 15,
    },
    // Success state styles
    successContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.secondary[500] + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    successTitle: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
    },
    successText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 24,
    },
    emailHighlight: {
      fontWeight: '600',
      color: theme.text,
    },
    successSubtext: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 22,
    },
    resendButton: {
      marginTop: 16,
    },
    resendText: {
      color: Colors.primary[600],
      fontSize: 15,
      textDecorationLine: 'underline',
    },
  })
