/**
 * Mukoko Lingo Brand Colors
 * Official Brand System from Mukoko Brand Guidelines
 *
 * Brand: Mukoko Lingo
 * Tagline: "Language lives in the hive"
 * Voice: Welcoming, structured, protective
 *
 * BRAND SYSTEM (Five African Minerals):
 * - PRIMARY: Cobalt #0047AB / #00B0FF (trust, clarity)
 * - SECONDARY: Tanzanite #4B0082 / #B388FF (depth, creativity)
 * - ACCENT: Gold #5D4037 / #FFD740 (achievement, warmth)
 */

export const Colors = {
  // Primary - Cobalt (Mukoko Lingo Brand Color)
  primary: {
    50: '#fef7f6',
    100: '#fdecea',
    200: '#fbd5d0',
    300: '#f7b5ac',
    400: '#f08879',
    500: '#e46b5a',
    600: '#D4634A', // Main brand color - Sunset Deep
    700: '#b8513c',
    800: '#994435',
    900: '#7f3b30',
  },

  // Secondary - Navy Blue (Education/Trust)
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1E3A8A', // Main secondary - Navy Blue
    900: '#1e3a5f',
  },

  // Accent - Purple (Innovation/Creativity)
  accent: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b7cf5',
    600: '#7C73E6', // Main accent - Purple
    700: '#6d5dd3',
    800: '#5b4cb8',
    900: '#4c3d9b',
  },

  // Success - Army Green (kept for success states)
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

  // Background colors
  background: {
    light: '#faf9fb',
    dark: '#101010',
    surface: '#f0eef4',
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
  primary: Colors.primary[600], // Sunset Deep
  secondary: Colors.secondary[800], // Navy Blue
  accent: Colors.accent[600], // Purple
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
  primary: Colors.primary[500], // Lighter Sunset for dark mode
  secondary: Colors.secondary[600], // Lighter Navy for dark mode
  accent: Colors.accent[500], // Lighter Purple for dark mode
  success: Colors.success[400],
  border: Colors.neutral[700],
  tint: Colors.primary[500],
  tabIconDefault: Colors.neutral[500],
  tabIconSelected: Colors.primary[500],
}

export type Theme = typeof lightTheme

// Default export for compatibility
export default {
  light: lightTheme,
  dark: darkTheme,
}
