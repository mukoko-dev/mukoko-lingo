import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { useAuth } from './_layout'

export default function IndexRedirect() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      // Authenticated user - go straight to app
      router.replace('/(tabs)')
    } else {
      // Unauthenticated user - always show landing page
      router.replace('/welcome')
    }
  }, [router, isAuthenticated, isLoading])

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
