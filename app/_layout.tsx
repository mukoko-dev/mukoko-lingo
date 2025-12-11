import FontAwesome from '@expo/vector-icons/FontAwesome'
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-reanimated'

import { ThemeProvider, useTheme } from '@/lib/hooks/useTheme'
import { initDatabase } from '@/lib/storage/database'
import { lightTheme, darkTheme } from '@/constants/Colors'

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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded && dbReady && onboardingChecked) {
      SplashScreen.hideAsync()
    }
  }, [loaded, dbReady, onboardingChecked])

  if (!loaded || !dbReady || !onboardingChecked) {
    return null
  }

  return (
    <ThemeProvider>
      <RootLayoutNav hasCompletedOnboarding={hasCompletedOnboarding} />
    </ThemeProvider>
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
      </Stack>
    </NavigationThemeProvider>
  )
}
