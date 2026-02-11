import { useState, useRef } from 'react'
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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Cloud,
  Bot,
  BarChart3,
  KeyRound,
  Link2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithOtp,
  verifyOtp,
  signInWithMagicLink,
  signInWithWhatsApp,
  verifyWhatsAppOtp,
  signOut,
} from '@/lib/auth/stytch-client'

type AuthMethod = 'otp' | 'magic-link' | 'password' | 'whatsapp'
type AuthStep = 'email' | 'verify-otp' | 'magic-link-sent' | 'password-form' | 'whatsapp-phone' | 'verify-whatsapp'

export default function AuthScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const [authMethod, setAuthMethod] = useState<AuthMethod>('otp')
  const [authStep, setAuthStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpMethodId, setOtpMethodId] = useState('')
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const { width } = useWindowDimensions()

  const otpInputRefs = useRef<(TextInput | null)[]>([])

  // Responsive breakpoints
  const isTablet = width >= 768

  const styles = createStyles(theme, isTablet)

  // Show error message inline (Alert.alert is unreliable on Expo Web)
  const showError = (message: string) => {
    setErrorMessage(message)
    setStatusMessage('')
    // Also try Alert for native platforms
    if (Platform.OS !== 'web') {
      Alert.alert('Error', message)
    }
  }

  // Clear error when user interacts
  const clearError = () => {
    if (errorMessage) setErrorMessage('')
  }

  // Email validation
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  // Password validation for sign up
  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(pw)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pw)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(pw)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  // Handle sending OTP code
  const handleSendOtp = async () => {
    clearError()
    if (!email) {
      showError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      showError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setStatusMessage('Sending code...')

    try {
      const result = await signInWithOtp(email)
      if (result.error) throw result.error
      if (result.method_id) setOtpMethodId(result.method_id)
      setAuthStep('verify-otp')
      setStatusMessage('')
    } catch (error: any) {
      showError(error.message || 'Failed to send code')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    clearError()
    const code = otpCode.join('')
    if (code.length !== 6) {
      showError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setStatusMessage('Verifying code...')

    try {
      const { data, error } = await verifyOtp(otpMethodId, code)
      if (error) throw error

      if (data?.session) {
        setStatusMessage('Success! Redirecting...')
        await new Promise(resolve => setTimeout(resolve, 500))
        router.replace('/(tabs)')
      } else {
        throw new Error('Verification failed. Please try again.')
      }
    } catch (error: any) {
      showError(error.message || 'Invalid code. Please try again.')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  // Handle magic link
  const handleSendMagicLink = async () => {
    clearError()
    if (!email) {
      showError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      showError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setStatusMessage('Sending magic link...')

    try {
      const { error } = await signInWithMagicLink(email)
      if (error) throw error
      setAuthStep('magic-link-sent')
      setStatusMessage('')
    } catch (error: any) {
      showError(error.message || 'Failed to send magic link')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  // Handle password auth (existing flow)
  const handlePasswordAuth = async () => {
    clearError()
    if (!email || !password) {
      showError('Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address')
      return
    }

    if (isSignUp) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        showError(passwordError)
        return
      }
      if (password !== confirmPassword) {
        showError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    setStatusMessage(isSignUp ? 'Creating account...' : 'Signing in...')

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password)
        if (error) throw error

        if (data?.user && !data?.session) {
          setLoading(false)
          setStatusMessage('Check your email! We sent a verification link to activate your account.')
        } else if (data?.session) {
          setStatusMessage('Account created! Redirecting...')
          await new Promise(resolve => setTimeout(resolve, 500))
          router.replace('/(tabs)')
        } else {
          throw new Error('Account creation failed. Please try again.')
        }
      } else {
        const { data, error } = await signInWithEmail(email, password)
        if (error) throw error

        if (!data?.session) {
          throw new Error('Sign in failed. Please check your credentials.')
        }

        if (data.user && data.user.status === 'pending') {
          await signOut()
          throw new Error('Please verify your email before signing in. Check your inbox.')
        }

        setStatusMessage('Success! Redirecting...')
        await new Promise(resolve => setTimeout(resolve, 500))
        router.replace('/(tabs)')
      }
    } catch (error: any) {
      showError(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle WhatsApp OTP send
  const handleSendWhatsAppOtp = async () => {
    clearError()
    if (!phoneNumber) {
      showError('Please enter your phone number')
      return
    }

    // Validate E.164 format
    const phoneRegex = /^\+[1-9]\d{6,14}$/
    if (!phoneRegex.test(phoneNumber)) {
      showError('Please enter a valid phone number with country code (e.g. +263771234567)')
      return
    }

    setLoading(true)
    setStatusMessage('Sending WhatsApp code...')

    try {
      const result = await signInWithWhatsApp(phoneNumber)
      if (result.error) throw result.error
      if (result.method_id) setOtpMethodId(result.method_id)
      setAuthStep('verify-whatsapp')
      setStatusMessage('')
    } catch (error: any) {
      showError(error.message || 'Failed to send WhatsApp OTP')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  // Handle WhatsApp OTP verification
  const handleVerifyWhatsAppOtp = async () => {
    clearError()
    const code = otpCode.join('')
    if (code.length !== 6) {
      showError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setStatusMessage('Verifying code...')

    try {
      const { data, error } = await verifyWhatsAppOtp(otpMethodId, code, phoneNumber)
      if (error) throw error

      if (data?.session) {
        setStatusMessage('Success! Redirecting...')
        await new Promise(resolve => setTimeout(resolve, 500))
        router.replace('/(tabs)')
      } else {
        throw new Error('Verification failed. Please try again.')
      }
    } catch (error: any) {
      showError(error.message || 'Invalid code. Please try again.')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input (typing or paste)
  const handleOtpInput = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '')

    if (digits.length > 1) {
      // Multi-digit input = paste. Distribute across all boxes starting from index 0.
      const newOtp = ['', '', '', '', '', '']
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i]
      }
      setOtpCode(newOtp)
      const focusIndex = Math.min(digits.length, 5)
      otpInputRefs.current[focusIndex]?.focus()
    } else {
      // Single digit input = normal typing
      const newOtp = [...otpCode]
      newOtp[index] = digits.slice(-1)
      setOtpCode(newOtp)

      // Auto-advance to next input
      if (digits && index < 5) {
        otpInputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleBack = () => {
    if (authStep === 'verify-whatsapp') {
      setAuthStep('whatsapp-phone')
      setOtpCode(['', '', '', '', '', ''])
      setOtpMethodId('')
      setStatusMessage('')
    } else if (authStep === 'verify-otp' || authStep === 'magic-link-sent' || authStep === 'password-form' || authStep === 'whatsapp-phone') {
      setAuthStep('email')
      setOtpCode(['', '', '', '', '', ''])
      setOtpMethodId('')
      setStatusMessage('')
    } else {
      router.back()
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)')
  }

  // Select auth method and advance
  const handleMethodSelect = (method: AuthMethod) => {
    setAuthMethod(method)
    setShowMoreOptions(false)
    if (method === 'password') {
      setAuthStep('password-form')
    } else if (method === 'whatsapp') {
      setAuthStep('whatsapp-phone')
    }
  }

  // Primary action based on current state
  const handlePrimaryAction = () => {
    if (authStep === 'email') {
      if (authMethod === 'otp') {
        handleSendOtp()
      } else if (authMethod === 'magic-link') {
        handleSendMagicLink()
      }
    } else if (authStep === 'verify-otp') {
      handleVerifyOtp()
    } else if (authStep === 'password-form') {
      handlePasswordAuth()
    }
  }

  // Resend code/link
  const handleResend = () => {
    if (authMethod === 'otp') {
      handleSendOtp()
    } else if (authMethod === 'magic-link') {
      handleSendMagicLink()
    } else if (authMethod === 'whatsapp') {
      handleSendWhatsAppOtp()
    }
  }

  const renderEmailStep = () => (
    <>
      <Text style={styles.cardTitle}>Welcome to Mukoko Lingo</Text>
      <Text style={styles.cardSubtitle}>
        Enter your email to sign in or create an account
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
          autoFocus
        />
      </View>

      {/* Primary Button - Send Code (OTP default) */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handlePrimaryAction}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>
              {authMethod === 'otp' ? 'Send Sign-in Code' : 'Send Magic Link'}
            </Text>
            <ArrowRight size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {/* Method Toggle */}
      <TouchableOpacity
        style={styles.methodToggle}
        onPress={() => setShowMoreOptions(!showMoreOptions)}
      >
        <Text style={styles.methodToggleText}>More sign-in options</Text>
        {showMoreOptions ? (
          <ChevronUp size={16} color={Colors.primary[600]} />
        ) : (
          <ChevronDown size={16} color={Colors.primary[600]} />
        )}
      </TouchableOpacity>

      {showMoreOptions && (
        <View style={styles.methodOptions}>
          {authMethod !== 'otp' && (
            <TouchableOpacity
              style={styles.methodOption}
              onPress={() => handleMethodSelect('otp')}
            >
              <View style={[styles.methodIconContainer, { backgroundColor: Colors.accent[600] + '20' }]}>
                <KeyRound size={18} color={Colors.accent[600]} />
              </View>
              <View style={styles.methodOptionTextContainer}>
                <Text style={styles.methodOptionTitle}>Email code</Text>
                <Text style={styles.methodOptionDescription}>
                  We'll send a 6-digit code to your email
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {authMethod !== 'magic-link' && (
            <TouchableOpacity
              style={styles.methodOption}
              onPress={() => handleMethodSelect('magic-link')}
            >
              <View style={[styles.methodIconContainer, { backgroundColor: Colors.secondary[800] + '20' }]}>
                <Link2 size={18} color={Colors.secondary[800]} />
              </View>
              <View style={styles.methodOptionTextContainer}>
                <Text style={styles.methodOptionTitle}>Magic link</Text>
                <Text style={styles.methodOptionDescription}>
                  We'll email you a link to sign in instantly
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {authMethod !== 'whatsapp' && (
            <TouchableOpacity
              style={styles.methodOption}
              onPress={() => handleMethodSelect('whatsapp')}
            >
              <View style={[styles.methodIconContainer, { backgroundColor: '#25D366' + '20' }]}>
                <MessageCircle size={18} color="#25D366" />
              </View>
              <View style={styles.methodOptionTextContainer}>
                <Text style={styles.methodOptionTitle}>WhatsApp</Text>
                <Text style={styles.methodOptionDescription}>
                  Receive a code via WhatsApp message
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {authMethod !== 'password' && (
            <TouchableOpacity
              style={styles.methodOption}
              onPress={() => handleMethodSelect('password')}
            >
              <View style={[styles.methodIconContainer, { backgroundColor: Colors.primary[600] + '20' }]}>
                <Lock size={18} color={Colors.primary[600]} />
              </View>
              <View style={styles.methodOptionTextContainer}>
                <Text style={styles.methodOptionTitle}>Password</Text>
                <Text style={styles.methodOptionDescription}>
                  Sign in or sign up with email and password
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  )

  const renderOtpVerifyStep = () => (
    <>
      <Text style={styles.cardTitle}>Enter your code</Text>
      <Text style={styles.cardSubtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otpCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => { otpInputRefs.current[index] = ref }}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null,
            ]}
            value={digit}
            onChangeText={(text) => handleOtpInput(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus()
              }
            }}
            keyboardType="number-pad"
            textAlign="center"
            autoFocus={index === 0}
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          otpCode.join('').length !== 6 && styles.submitButtonDisabled,
        ]}
        onPress={handleVerifyOtp}
        disabled={loading || otpCode.join('').length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Verify Code</Text>
            <ArrowRight size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={loading}>
        <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
      </TouchableOpacity>
    </>
  )

  const renderMagicLinkSentStep = () => (
    <>
      <View style={styles.sentIconContainer}>
        <Mail size={48} color={Colors.primary[600]} />
      </View>
      <Text style={styles.cardTitle}>Check your email</Text>
      <Text style={styles.cardSubtitle}>
        We sent a magic link to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
        {'\n\n'}Click the link in the email to sign in. You can close this screen.
      </Text>

      {/* Resend */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleResend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary[600]} />
        ) : (
          <Text style={styles.secondaryButtonText}>Resend magic link</Text>
        )}
      </TouchableOpacity>

      {/* Switch to OTP instead */}
      <TouchableOpacity
        style={styles.switchMethodButton}
        onPress={() => {
          setAuthMethod('otp')
          setAuthStep('email')
        }}
      >
        <Text style={styles.switchMethodText}>Use a code instead</Text>
      </TouchableOpacity>
    </>
  )

  const renderPasswordForm = () => (
    <>
      <Text style={styles.cardTitle}>
        {isSignUp ? 'Create Account' : 'Sign In'}
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
      {isSignUp && (
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
      {!isSignUp && (
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
        onPress={handlePasswordAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
            <ArrowRight size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {/* Toggle Sign In / Sign Up */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text style={styles.toggleText}>
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>

      {/* Switch to passwordless */}
      <TouchableOpacity
        style={styles.switchMethodButton}
        onPress={() => {
          setAuthMethod('otp')
          setAuthStep('email')
        }}
      >
        <Text style={styles.switchMethodText}>Use passwordless sign-in instead</Text>
      </TouchableOpacity>
    </>
  )

  const renderWhatsAppPhoneStep = () => (
    <>
      <Text style={styles.cardTitle}>WhatsApp Sign In</Text>
      <Text style={styles.cardSubtitle}>
        Enter your phone number with country code to receive a verification code via WhatsApp
      </Text>

      {/* Phone Number Input */}
      <View style={styles.inputContainer}>
        <Phone size={20} color={theme.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+263 77 123 4567"
          placeholderTextColor={theme.textMuted}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSendWhatsAppOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Send WhatsApp Code</Text>
            <ArrowRight size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {/* Switch to email */}
      <TouchableOpacity
        style={styles.switchMethodButton}
        onPress={() => {
          setAuthMethod('otp')
          setAuthStep('email')
        }}
      >
        <Text style={styles.switchMethodText}>Use email sign-in instead</Text>
      </TouchableOpacity>
    </>
  )

  const renderWhatsAppVerifyStep = () => (
    <>
      <Text style={styles.cardTitle}>Enter your code</Text>
      <Text style={styles.cardSubtitle}>
        We sent a 6-digit code via WhatsApp to{'\n'}
        <Text style={styles.emailHighlight}>{phoneNumber}</Text>
      </Text>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otpCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => { otpInputRefs.current[index] = ref }}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null,
            ]}
            value={digit}
            onChangeText={(text) => handleOtpInput(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus()
              }
            }}
            keyboardType="number-pad"
            textAlign="center"
            autoFocus={index === 0}
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          otpCode.join('').length !== 6 && styles.submitButtonDisabled,
        ]}
        onPress={handleVerifyWhatsAppOtp}
        disabled={loading || otpCode.join('').length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Verify Code</Text>
            <ArrowRight size={20} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={loading}>
        <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
      </TouchableOpacity>
    </>
  )

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
              <Text style={styles.title}>Mukoko Lingo</Text>
              <Text style={styles.subtitle}>
                Learn African Languages with AI
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <TouchableOpacity
                style={styles.errorContainer}
                onPress={() => setErrorMessage('')}
                activeOpacity={0.8}
              >
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Text style={styles.errorDismiss}>Tap to dismiss</Text>
              </TouchableOpacity>
            ) : null}

            {/* Status Message */}
            {statusMessage ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color={Colors.primary[600]} />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Auth Card */}
            <View style={styles.card}>
              {authStep === 'email' && renderEmailStep()}
              {authStep === 'verify-otp' && renderOtpVerifyStep()}
              {authStep === 'magic-link-sent' && renderMagicLinkSentStep()}
              {authStep === 'password-form' && renderPasswordForm()}
              {authStep === 'whatsapp-phone' && renderWhatsAppPhoneStep()}
              {authStep === 'verify-whatsapp' && renderWhatsAppVerifyStep()}
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
      marginBottom: 24,
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
    errorContainer: {
      backgroundColor: '#fef2f2',
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 14,
      color: '#dc2626',
      fontWeight: '500',
      textAlign: 'center',
    },
    errorDismiss: {
      fontSize: 12,
      color: '#9ca3af',
      textAlign: 'center',
      marginTop: 4,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      gap: 8,
    },
    statusText: {
      fontSize: 14,
      color: Colors.primary[600],
      fontWeight: '500',
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
      marginBottom: 8,
    },
    cardSubtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    emailHighlight: {
      fontWeight: '600',
      color: theme.text,
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
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '600',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1.5,
      borderColor: Colors.primary[600],
    },
    secondaryButtonText: {
      color: Colors.primary[600],
      fontSize: 16,
      fontWeight: '600',
    },
    methodToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 4,
    },
    methodToggleText: {
      color: Colors.primary[600],
      fontSize: 14,
      fontWeight: '500',
    },
    methodOptions: {
      marginTop: 16,
      gap: 10,
    },
    methodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    methodIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodOptionTextContainer: {
      flex: 1,
    },
    methodOptionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    methodOptionDescription: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    otpInput: {
      width: isTablet ? 52 : 46,
      height: isTablet ? 56 : 52,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.background,
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    otpInputFilled: {
      borderColor: Colors.primary[600],
      backgroundColor: Colors.primary[600] + '08',
    },
    resendButton: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    resendText: {
      color: Colors.primary[600],
      fontSize: 14,
    },
    sentIconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    switchMethodButton: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    switchMethodText: {
      color: theme.textMuted,
      fontSize: 14,
      textDecorationLine: 'underline',
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
