import FontAwesome from '@expo/vector-icons/FontAwesome'
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, createContext, useContext } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Linking from 'expo-linking'
import 'react-native-reanimated'

import { ThemeProvider, useTheme } from '@/lib/hooks/useTheme'
import { LearningLanguageProvider } from '@/lib/hooks/useLearningLanguage'
import { UILanguageProvider } from '@/lib/hooks/useUILanguage'
import { initDatabase } from '@/lib/storage/database'
import { lightTheme, darkTheme } from '@/constants/Colors'
import {
  onAuthStateChange,
  getSession,
  authenticateMagicLink,
  isAuthConfigured,
  type StytchSession,
} from '@/lib/auth/stytch-client'

// Auth context for global auth state
type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  session: StytchSession | null
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  session: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export {
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  initialRouteName: 'index',
}

const ONBOARDING_KEY = '@mukoko_onboarding_complete'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// Custom theme with Mukoko Lingo brand colors
const MukokoLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightTheme.primary,
    background: lightTheme.background,
    card: lightTheme.card,
    text: lightTheme.text,
    border: lightTheme.border,
  },
}

const MukokoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkTheme.primary,
    background: darkTheme.background,
    card: darkTheme.card,
    text: darkTheme.text,
    border: darkTheme.border,
  },
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [authState, setAuthState] = useState<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
  })
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })

  // Initialize database
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(console.error)
  }, [])

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
        setHasCompletedOnboarding(completed === 'true')
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setOnboardingChecked(true)
      }
    }
    checkOnboarding()
  }, [])

  // Initialize auth state and listen for changes (Stytch)
  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthConfigured()) {
        // No auth configured - allow offline mode
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          session: null,
        })
        return
      }

      const { session } = await getSession()
      setAuthState({
        isAuthenticated: !!session,
        isLoading: false,
        session,
      })
    }
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      setAuthState({
        isAuthenticated: !!session,
        isLoading: false,
        session,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle deep links for magic link auth on native platforms
  useEffect(() => {
    if (Platform.OS === 'web') return

    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url
      if (!url) return

      // Extract token from deep link for Stytch magic link
      // Format: mukokolingo://[path]?token=...&stytch_token_type=magic_links
      try {
        const urlObj = new URL(url)
        const token = urlObj.searchParams.get('token')
        const tokenType = urlObj.searchParams.get('stytch_token_type')

        if (token && tokenType === 'magic_links') {
          await authenticateMagicLink(token)
        }
      } catch {
        // Also handle hash-based tokens for backwards compatibility
        const hashIndex = url.indexOf('#')
        if (hashIndex !== -1) {
          const hashParams = new URLSearchParams(url.substring(hashIndex + 1))
          const token = hashParams.get('token')
          if (token) {
            await authenticateMagicLink(token)
          }
        }
      }
    }

    // Handle links that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url })
    })

    // Handle links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink)

    return () => {
      subscription.remove()
    }
  }, [])

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded && dbReady && onboardingChecked && !authState.isLoading) {
      SplashScreen.hideAsync()
    }
  }, [loaded, dbReady, onboardingChecked, authState.isLoading])

  if (!loaded || !dbReady || !onboardingChecked || authState.isLoading) {
    return null
  }

  return (
    <AuthContext.Provider value={authState}>
      <ThemeProvider>
        <UILanguageProvider>
          <LearningLanguageProvider>
            <RootLayoutNav hasCompletedOnboarding={hasCompletedOnboarding} />
          </LearningLanguageProvider>
        </UILanguageProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  )
}

function RootLayoutNav({ hasCompletedOnboarding }: { hasCompletedOnboarding: boolean }) {
  const { colorScheme } = useTheme()
  const router = useRouter()
  const segments = useSegments()

  // No automatic redirect - let index.tsx handle the initial routing
  // This keeps the navigation clean and allows users to access all public pages

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? MukokoDarkTheme : MukokoLightTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="phrase/[id]"
          options={{
            presentation: 'modal',
            headerTitle: 'Phrase Details',
          }}
        />
        <Stack.Screen
          name="assessment/[skill]"
          options={{
            headerTitle: 'Skills Assessment',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="auth/index"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="about/index" options={{ headerShown: false }} />
        <Stack.Screen name="features/index" options={{ headerShown: false }} />
        <Stack.Screen name="why/index" options={{ headerShown: false }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  )
}
