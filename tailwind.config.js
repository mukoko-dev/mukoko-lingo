/**
 * Tailwind CSS Configuration — Five African Minerals Design System
 *
 * Brand tokens from registry.mukoko.com aligned with constants/Colors.ts.
 * Used by NativeWind for React Native + web styling.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary — Cobalt (trust, clarity)
        cobalt: {
          50: '#e8f4ff',
          100: '#d0e8ff',
          200: '#a3d4ff',
          300: '#66bbff',
          400: '#00B0FF',
          500: '#0088dd',
          600: '#0047AB',
          700: '#003d94',
          800: '#003380',
          900: '#002560',
        },
        // Secondary — Tanzanite (depth, creativity)
        tanzanite: {
          50: '#f8f2ff',
          100: '#f0e5ff',
          200: '#dcc6ff',
          300: '#B388FF',
          400: '#9a60ff',
          500: '#8040e8',
          600: '#6620cc',
          700: '#5600a8',
          800: '#4B0082',
          900: '#350060',
        },
        // Accent — Gold (achievement, warmth)
        gold: {
          50: '#fff8e6',
          100: '#ffefbf',
          200: '#FFD740',
          300: '#ffc107',
          400: '#e8a800',
          500: '#cc9200',
          600: '#8B6914',
          700: '#5D4037',
          800: '#4a3020',
          900: '#362010',
        },
        // Success — Army Green (mastery, progress)
        army: {
          50: '#f0f7ed',
          100: '#dcecd5',
          200: '#b8d9ac',
          300: '#8FB47F',
          400: '#729B63',
          500: '#5a8449',
          600: '#4a6e3b',
          700: '#3b5830',
          800: '#2c4224',
          900: '#1e2c18',
        },
        // Backgrounds
        cream: '#FAF9F5',
        charcoal: '#0A0A0A',
        surface: {
          light: '#F3F2EE',
          dark: '#1E1E1E',
        },
        card: {
          light: '#FFFFFF',
          dark: '#141414',
        },
      },
      fontFamily: {
        sans: ['System', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
