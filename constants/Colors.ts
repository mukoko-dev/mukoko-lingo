/**
 * Nyuchi Lingo Brand Colors
 * Official colors from https://assets.nyuchi.com/api/v5/platform/lingo
 *
 * Brand: Nyuchi Lingo
 * Tagline: "Learn Shona. Connect with Africa."
 * Voice: Encouraging, educational, culturally respectful
 */

export const Colors = {
  // Primary - Warm Purple (Nyuchi Africa)
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#9186ae',
    600: '#7c73e6', // Ubuntu blue (dark mode)
    700: '#5f5873', // Main brand color
    800: '#4a4560',
    900: '#3d3a4d',
  },

  // Secondary - Army Green (Success)
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#8FB47F',
    500: '#729B63', // Main green
    600: '#5d804f',
    700: '#4d6b42',
    800: '#3f5836',
    900: '#34472d',
  },

  // Accent - Sunset Gold
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#F6AD55', // Main accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Neutrals
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: '#729B63',
  warning: '#F6AD55',
  error: '#ef4444',
  info: '#3b82f6',

  // Background colors (from official brand)
  background: {
    light: '#faf9fb', // Official subtle background
    dark: '#101010',
    surface: '#f0eef4', // Official surface color
    card: {
      light: '#ffffff',
      dark: '#1a1a1a',
    },
  },

  // Text colors
  text: {
    primary: {
      light: '#171717',
      dark: '#fafafa',
    },
    secondary: {
      light: '#525252',
      dark: '#a3a3a3',
    },
    muted: {
      light: '#737373',
      dark: '#737373',
    },
  },
}

// Theme configuration for light/dark mode
export const lightTheme = {
  background: Colors.background.light,
  card: Colors.background.card.light,
  text: Colors.text.primary.light,
  textSecondary: Colors.text.secondary.light,
  textMuted: Colors.text.muted.light,
  primary: Colors.primary[700],
  secondary: Colors.secondary[500],
  accent: Colors.accent[500],
  border: Colors.neutral[200],
  tint: Colors.primary[700],
  tabIconDefault: Colors.neutral[400],
  tabIconSelected: Colors.primary[700],
}

export const darkTheme = {
  background: Colors.background.dark,
  card: Colors.background.card.dark,
  text: Colors.text.primary.dark,
  textSecondary: Colors.text.secondary.dark,
  textMuted: Colors.text.muted.dark,
  primary: Colors.primary[600], // Ubuntu blue in dark mode
  secondary: Colors.secondary[400],
  accent: Colors.accent[500],
  border: Colors.neutral[700],
  tint: Colors.primary[600],
  tabIconDefault: Colors.neutral[500],
  tabIconSelected: Colors.primary[600],
}

export type Theme = typeof lightTheme

// Default export for compatibility
export default {
  light: lightTheme,
  dark: darkTheme,
}
