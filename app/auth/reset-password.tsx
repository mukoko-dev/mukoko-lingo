import { useState, useEffect } from 'react'
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
import { useRouter, Stack, useLocalSearchParams } from 'expo-router'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { updatePassword } from '@/lib/supabase/client'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const params = useLocalSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const styles = createStyles(theme, isTablet)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleResetPassword = async () => {
    const validationError = validatePassword(password)
    if (validationError) {
      Alert.alert('Invalid Password', validationError)
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) throw error
      setSuccess(true)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.replace('/auth')
  }

  const handleGoToApp = () => {
    router.replace('/(tabs)')
  }

  if (success) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={64} color={Colors.secondary[500]} />
            </View>
            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successText}>
              Your password has been successfully updated.{'\n'}
              You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleGoToApp}
            >
              <Text style={styles.submitButtonText}>Continue to App</Text>
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
                source={require('@/assets/images/nyuchi-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Enter a strong password for your account
              </Text>
            </View>

            {/* Reset Card */}
            <View style={styles.card}>
              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Password Requirements */}
              <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Password must contain:</Text>
                <RequirementItem
                  met={password.length >= 8}
                  text="At least 8 characters"
                  theme={theme}
                />
                <RequirementItem
                  met={/[A-Z]/.test(password)}
                  text="One uppercase letter"
                  theme={theme}
                />
                <RequirementItem
                  met={/[a-z]/.test(password)}
                  text="One lowercase letter"
                  theme={theme}
                />
                <RequirementItem
                  met={/[0-9]/.test(password)}
                  text="One number"
                  theme={theme}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!password || !confirmPassword) && styles.submitButtonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

function RequirementItem({
  met,
  text,
  theme,
}: {
  met: boolean
  text: string
  theme: typeof lightTheme
}) {
  return (
    <View style={requirementStyles.container}>
      <View
        style={[
          requirementStyles.indicator,
          { backgroundColor: met ? Colors.secondary[500] : theme.border },
        ]}
      />
      <Text
        style={[
          requirementStyles.text,
          { color: met ? theme.text : theme.textMuted },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}

const requirementStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontSize: 14,
  },
})

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
    requirements: {
      marginBottom: 16,
      paddingTop: 8,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 12,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary[600],
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '600',
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
      marginBottom: 32,
      lineHeight: 24,
    },
  })
