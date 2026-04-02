/**
 * L1 Primitive — Button
 *
 * Base button with variant support. All other buttons compose from this.
 * Follows registry CVA pattern adapted for React Native StyleSheet.
 */

import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  children,
}: ButtonProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const variantStyles = getVariantStyles(variant, theme)
  const sizeStyles = getSizeStyles(size)

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        (disabled || loading) && styles.disabled,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text.color as string} />
      ) : (
        <Text style={[styles.text, variantStyles.text, sizeStyles.text]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

function getVariantStyles(variant: ButtonVariant, theme: any): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return { container: { backgroundColor: theme.primary }, text: { color: '#FFFFFF' } }
    case 'secondary':
      return { container: { backgroundColor: theme.secondary }, text: { color: '#FFFFFF' } }
    case 'outline':
      return { container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }, text: { color: theme.text } }
    case 'ghost':
      return { container: { backgroundColor: 'transparent' }, text: { color: theme.text } }
    case 'destructive':
      return { container: { backgroundColor: '#B3261E' }, text: { color: '#FFFFFF' } }
  }
}

function getSizeStyles(size: ButtonSize): { container: ViewStyle; text: TextStyle } {
  switch (size) {
    case 'sm': return { container: { paddingHorizontal: 12, paddingVertical: 6 }, text: { fontSize: 13 } }
    case 'md': return { container: { paddingHorizontal: 16, paddingVertical: 10 }, text: { fontSize: 15 } }
    case 'lg': return { container: { paddingHorizontal: 24, paddingVertical: 14 }, text: { fontSize: 17 } }
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48, // registry: 48px touch target
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
})
