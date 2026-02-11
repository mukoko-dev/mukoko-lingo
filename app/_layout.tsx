import FontAwesome from '@expo/vector-icons/FontAwesome'
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native'
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
import { initDatabase } from '@/lib/storage/database'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { onAuthStateChange, getSession, getSupabase } from '@/lib/supabase/client'

// Auth context for global auth state
type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  session: any | null
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

const ONBOARDING_KEY = '@nyuchi_onboarding_complete'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// Custom theme with Nyuchi Lingo brand colors
const NyuchiLightTheme = {
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

const NyuchiDarkTheme = {
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

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
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

      // Extract token hash from deep link (magic link / password reset)
      // Format: nyuchilingo://[path]#access_token=...&refresh_token=...
      const hashIndex = url.indexOf('#')
      if (hashIndex === -1) return

      const hashParams = new URLSearchParams(url.substring(hashIndex + 1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const supabase = getSupabase()
        if (supabase) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
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
        <LearningLanguageProvider>
          <RootLayoutNav hasCompletedOnboarding={hasCompletedOnboarding} />
        </LearningLanguageProvider>
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
    <NavigationThemeProvider value={colorScheme === 'dark' ? NyuchiDarkTheme : NyuchiLightTheme}>
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
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
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
      </Stack>
    </NavigationThemeProvider>
  )
}
