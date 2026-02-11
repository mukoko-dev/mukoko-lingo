import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme } from '@/constants/Colors'

const ONBOARDING_KEY = '@mukoko_onboarding_complete'

export default function IndexRedirect() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
        if (completed === 'true') {
          // Returning user - go straight to app
          router.replace('/(tabs)')
        } else {
          // New user - show welcome/landing page (NOT onboarding)
          router.replace('/welcome')
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
        router.replace('/welcome')
      }
    }

    checkAndRedirect()
  }, [router])

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
