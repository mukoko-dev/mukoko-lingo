/**
 * Global App Footer
 *
 * Displays version and company info at the bottom of every screen.
 */

import React from 'react'
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { APP_VERSION, APP_NAME, COMPANY_NAME, COMPANY_URL } from '@/constants/Version'

export function AppFooter() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      <Text style={[styles.version, { color: theme.textMuted }]}>
        {APP_NAME} v{APP_VERSION}
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(COMPANY_URL)}>
        <Text style={[styles.company, { color: theme.textMuted }]}>
          {COMPANY_NAME}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  version: {
    fontSize: 11,
    fontWeight: '500',
  },
  company: {
    fontSize: 10,
    marginTop: 2,
  },
})
