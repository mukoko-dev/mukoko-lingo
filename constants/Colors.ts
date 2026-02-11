/**
 * Mukoko Lingo Brand Colors
 * Official Brand System from Mukoko Brand Guidelines v1.0
 *
 * Brand: Mukoko Lingo (part of Mukoko ecosystem)
 * Tagline: "Language lives in the hive"
 * Voice: Welcoming, structured, protective
 *
 * BRAND SYSTEM (Five African Minerals):
 * - PRIMARY: Cobalt #0047AB / #00B0FF (trust, clarity)
 * - SECONDARY: Tanzanite #4B0082 / #B388FF (depth, creativity)
 * - ACCENT: Gold #5D4037 / #FFD740 (achievement, warmth)
 *
 * Dark Theme: Default Charcoal (#0A0A0A base, #141414 surface)
 * Light Theme: Warm Cream (#FAF9F5 base, #FFFFFF surface)
 */

export const Colors = {
  // Primary - Cobalt (trust, clarity)
  // Light mode: #0047AB | Dark mode: #00B0FF
  primary: {
    50: '#e8f4ff',
    100: '#d0e8ff',
    200: '#a3d4ff',
    300: '#66bbff',
    400: '#00B0FF',  // Dark mode primary
    500: '#0088dd',
    600: '#0047AB',  // Light mode primary (MAIN)
    700: '#003d94',
    800: '#003380',
    900: '#002560',
  },

  // Secondary - Tanzanite (depth, creativity)
  // Light mode: #4B0082 | Dark mode: #B388FF
  secondary: {
    50: '#f8f2ff',
    100: '#f0e5ff',
    200: '#dcc6ff',
    300: '#B388FF',  // Dark mode secondary
    400: '#9a60ff',
    500: '#8040e8',
    600: '#6620cc',
    700: '#5600a8',
    800: '#4B0082',  // Light mode secondary (MAIN)
    900: '#350060',
  },

  // Accent - Gold (achievement, warmth)
  // Light mode: #5D4037 | Dark mode: #FFD740
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#FFD740',  // Dark mode accent (bright gold)
    400: '#f5c518',
    500: '#d4a80f',
    600: '#a88010',
    700: '#7c5d0e',
    800: '#5D4037',  // Light mode accent (warm brown)
    900: '#3e2a22',
  },

  // Success - Army Green (semantic: mastery, progress)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#8FB47F',
    500: '#729B63',
    600: '#5d804f',
    700: '#4d6b42',
    800: '#3f5836',
    900: '#34472d',
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
  semanticSuccess: '#729B63',
  semanticWarning: '#F6AD55',
  semanticError: '#ef4444',
  semanticInfo: '#3b82f6',

  // Background colors (Mukoko brand)
  background: {
    light: '#FAF9F5',      // Warm Cream
    dark: '#0A0A0A',       // Charcoal base (NOT Slate)
    surface: '#F3F2EE',    // Surface Dim
    elevated: '#1E1E1E',   // Dark elevated surface
    card: {
      light: '#FFFFFF',
      dark: '#141414',     // Charcoal card surface
    },
  },

  // Text colors (Mukoko brand)
  text: {
    primary: {
      light: '#141413',
      dark: '#F5F5F4',
    },
    secondary: {
      light: '#52524E',
      dark: '#A8A8A3',
    },
    muted: {
      light: '#8C8B87',
      dark: '#6B6B66',
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
  primary: Colors.primary[600],      // Cobalt #0047AB
  secondary: Colors.secondary[800],  // Tanzanite #4B0082
  accent: Colors.accent[800],        // Gold (warm brown) #5D4037
  success: Colors.success[500],
  border: Colors.neutral[200],
  tint: Colors.primary[600],
  tabIconDefault: Colors.neutral[400],
  tabIconSelected: Colors.primary[600],
}

export const darkTheme = {
  background: Colors.background.dark,
  card: Colors.background.card.dark,
  text: Colors.text.primary.dark,
  textSecondary: Colors.text.secondary.dark,
  textMuted: Colors.text.muted.dark,
  primary: Colors.primary[400],      // Cobalt bright #00B0FF
  secondary: Colors.secondary[300],  // Tanzanite bright #B388FF
  accent: Colors.accent[300],        // Gold bright #FFD740
  success: Colors.success[400],
  border: Colors.neutral[700],
  tint: Colors.primary[400],
  tabIconDefault: Colors.neutral[500],
  tabIconSelected: Colors.primary[400],
}

export type Theme = typeof lightTheme

// Default export for compatibility
export default {
  light: lightTheme,
  dark: darkTheme,
}
