import { Stack } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme } from '@/constants/Colors'

export default function AdminLayout() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="phrases/index"
        options={{ headerTitle: 'Manage Phrases' }}
      />
      <Stack.Screen
        name="phrases/edit"
        options={{ headerTitle: 'Phrase Editor' }}
      />
    </Stack>
  )
}
