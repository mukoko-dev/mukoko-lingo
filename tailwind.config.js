// Nyuchi Lingo - Tailwind CSS Configuration
// Version 3.0 - Nyuchi Africa Ecosystem Alignment
// Last Updated: November 10, 2025

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1400px',
      },
    },
    extend: {
      // ====================
      // COLORS - Nyuchi Africa Aligned
      // ====================
      colors: {
        // Base semantic colors (shadcn/ui structure)
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        
        // Primary - Warm Purple (Nyuchi Africa)
        primary: {
          DEFAULT: "#5f5873",
          hover: "#7c73e6",
          dark: "#4a4560",
          light: "#8f86a8",
          foreground: "#ffffff",
          50: '#faf9fb',
          100: '#f0eef4',
          200: '#e1dde9',
          300: '#cbc5d8',
          400: '#afa5c3',
          500: '#9186ae',
          600: '#7c73e6', // Ubuntu Blue highlight
          700: '#5f5873', // Main brand color
          800: '#4a4560',
          900: '#3a3549',
        },
        
        // Secondary - Army Green (Success & Milestones)
        secondary: {
          DEFAULT: "#729B63",
          dark: "#8FB47F",
          foreground: "#ffffff",
          50: '#f5f9f3',
          100: '#e6f2e1',
          200: '#cde5c3',
          300: '#a8d197',
          400: '#8FB47F',
          500: '#729B63',
          600: '#5d804f',
          700: '#4a6640',
          800: '#3c5235',
          900: '#32442d',
        },
        
        // Accent - Sunset Deep
        accent: {
          DEFAULT: "#d4634a",
          foreground: "#ffffff",
          50: '#fef5f3',
          100: '#fde8e3',
          200: '#fbd0c7',
          300: '#f7aea0',
          400: '#f18d79',
          500: '#d4634a',
          600: '#c54f37',
          700: '#a4412e',
          800: '#843428',
          900: '#6b2b22',
        },

        // Warm Brown - Cultural Context
        'warm-brown': {
          DEFAULT: "#8B7355",
          foreground: "#ffffff",
          50: '#f9f7f5',
          100: '#f0ebe6',
          200: '#e0d6cc',
          300: '#cdb9a8',
          400: '#b69a81',
          500: '#8B7355',
          600: '#765f47',
          700: '#604d3a',
          800: '#4d3e2f',
          900: '#3f3327',
        },

        // Semantic colors
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        
        // Status colors
        success: {
          DEFAULT: '#10b981',
          light: '#86efac',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fca5a5',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#2563eb',
        },
        
        // Gamification colors
        streak: {
          DEFAULT: '#f97316', // Orange
          light: '#fdba74',
          dark: '#ea580c',
        },
        achievement: {
          DEFAULT: '#eab308', // Gold
          light: '#fde047',
          dark: '#ca8a04',
        },
        
        // Custom Nyuchi colors
        nyuchi: {
          purple: '#5f5873',
          'purple-hover': '#7c73e6',
          'ubuntu-blue': '#7c73e6',
          'army-green': '#729B63',
          'army-green-dark': '#8FB47F',
          'warm-brown': '#8B7355',
          'sunset-deep': '#d4634a',
          'wisdom-dark': '#1a1a1a',
        },

        // ====================
        // SECONDARY COLORS - Category & Label System
        // Source: NYUCHI_LINGO_SECONDARY_COLORS.md v3.0
        // All colors WCAG 2.1 AA compliant
        // ====================

        // 1. Terracotta (Culture & Heritage)
        terracotta: {
          50: '#fef7f3',
          100: '#fde9dc',
          200: '#fbd1b8',
          300: '#f8b994',
          400: '#f4986d',
          500: '#ef7647',
          600: '#d9623a',
          700: '#b24e2e',
          800: '#8b3d24',
          900: '#6b2f1c',
        },

        // 2. Coral (Speaking & Pronunciation)
        coral: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#ff6b6b',
          600: '#fa5252',
          700: '#e03131',
          800: '#c92a2a',
          900: '#a61e1e',
        },

        // 3. Amber (Intermediate Level)
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // 4. Sage Green (Grammar & Structure)
        sage: {
          50: '#f3f9f3',
          100: '#e3f2e3',
          200: '#c8e6c8',
          300: '#a8d5a8',
          400: '#88c288',
          500: '#6ba76b',
          600: '#5a8f5a',
          700: '#4a774a',
          800: '#3b5f3b',
          900: '#2e492e',
        },

        // 5. Sky Blue (Listening & Comprehension)
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        // 6. Lavender (Reading & Writing)
        lavender: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },

        // 7. Teal (Vocabulary & Words)
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },

        // 8. Marigold (Advanced Level)
        marigold: {
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fde68a',
          300: '#faca15',
          400: '#eab308',
          500: '#ca8a04',
          600: '#a16207',
          700: '#854d0e',
          800: '#713f12',
          900: '#5a3310',
        },

        // 9. Rose (Community & Social)
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },

        // 10. Indigo (Premium & Pro Features)
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      
      // ====================
      // TYPOGRAPHY - Noto Serif + Poppins + Noto Sans
      // ====================
      fontFamily: {
        // Display & Titles - Noto Serif (800+ languages)
        display: [
          'Noto Serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
        // Headings (H1-H6) - Poppins
        heading: [
          'Poppins',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Legacy serif support
        serif: [
          'Noto Serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
        // Body Text & UI - Noto Sans
        sans: [
          'Noto Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Monospace (code)
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      
      // Font sizes with line heights
      fontSize: {
        // Micro
        'xs': ['0.75rem', { lineHeight: '1.5' }],     // 12px
        // Small
        'sm': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        // Base body
        'base': ['1rem', { lineHeight: '1.6' }],      // 16px
        // Large body
        'lg': ['1.125rem', { lineHeight: '1.6' }],    // 18px
        // H4
        'xl': ['1.25rem', { lineHeight: '1.4' }],     // 20px
        // H3
        '2xl': ['1.75rem', { lineHeight: '1.3' }],    // 28px
        // H2
        '3xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
        // H1
        '4xl': ['3.5rem', { lineHeight: '1.2' }],     // 56px
        // Hero
        '5xl': ['4rem', { lineHeight: '1.1' }],       // 64px
      },
      
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      
      // ====================
      // SPACING - 4px Grid System
      // ====================
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '0.75rem',    // 12px
        'lg': '1rem',       // 16px
        'xl': '1.5rem',     // 24px
        '2xl': '2rem',      // 32px
        '3xl': '3rem',      // 48px
        '4xl': '4rem',      // 64px
        '5xl': '5rem',      // 80px
      },
      
      // ====================
      // BORDER RADIUS - Claude-inspired
      // ====================
      borderRadius: {
        sm: '0.5rem',       // 8px
        DEFAULT: '0.625rem', // 10px (Claude-style buttons)
        md: '0.625rem',     // 10px
        lg: '0.75rem',      // 12px (cards)
        xl: '1rem',         // 16px (modals)
        '2xl': '1.25rem',   // 20px
        full: '9999px',     // Pills
      },
      
      // ====================
      // SHADOWS - Soft & Layered
      // ====================
      boxShadow: {
        // Elevation levels
        'level-1': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'level-2': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'level-3': '0 4px 16px 0 rgba(0, 0, 0, 0.10)',
        'level-4': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        
        // Focus state
        'focus-purple': '0 0 0 3px rgba(95, 88, 115, 0.3)',
        'focus-primary': '0 0 0 3px rgba(95, 88, 115, 0.3)',
        
        // Custom shadows
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
        'modal': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        
        // Default shadcn
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "0 0 #0000",
      },
      
      // ====================
      // ANIMATIONS - Smooth transitions
      // ====================
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // ====================
      // KEYFRAMES - Custom animations
      // ====================
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "lift": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "lift": "lift 0.2s ease-out forwards",
      },
      
      // ====================
      // BREAKPOINTS - Custom screens
      // ====================
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
}

// ====================
// CSS VARIABLES (globals.css)
// ====================
/*
Add to your globals.css file:

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    // Backgrounds
    --background: 247 250 252;        // #f7fafc
    --foreground: 26 26 26;           // #1a1a1a
    
    // Cards
    --card: 250 250 250;              // #fafafa
    --card-foreground: 26 26 26;      // #1a1a1a
    
    // Popovers
    --popover: 250 250 250;           // #fafafa
    --popover-foreground: 26 26 26;   // #1a1a1a
    
    // Primary - Warm Purple
    --primary: 95 88 115;             // #5f5873
    --primary-foreground: 255 255 255; // #ffffff
    
    // Secondary - Army Green
    --secondary: 114 155 99;          // #729B63
    --secondary-foreground: 255 255 255; // #ffffff
    
    // Muted
    --muted: 229 231 235;             // #e5e7eb
    --muted-foreground: 102 102 102;  // #666666
    
    // Accent - Sunset Gold
    --accent: 246 173 85;             // #F6AD55
    --accent-foreground: 26 26 26;    // #1a1a1a
    
    // Destructive
    --destructive: 239 68 68;         // #ef4444
    --destructive-foreground: 255 255 255; // #ffffff
    
    // Border & Input
    --border: 224 224 224;            // #e0e0e0
    --input: 224 224 224;             // #e0e0e0
    
    // Ring (focus)
    --ring: 95 88 115;                // #5f5873
    
    // Radius
    --radius: 0.625rem;               // 10px (Claude-style)
  }
  
  .dark {
    // Dark mode colors
    --background: 26 26 26;           // #1a1a1a
    --foreground: 250 250 250;        // #fafafa
    
    --card: 42 42 42;                 // #2a2a2a
    --card-foreground: 250 250 250;   // #fafafa
    
    --popover: 42 42 42;              // #2a2a2a
    --popover-foreground: 250 250 250; // #fafafa
    
    --primary: 124 115 230;           // #7c73e6 (Ubuntu Blue)
    --primary-foreground: 255 255 255; // #ffffff
    
    --secondary: 143 180 127;         // #8FB47F (Lighter army green)
    --secondary-foreground: 26 26 26; // #1a1a1a
    
    --muted: 74 69 96;                // #4a4560
    --muted-foreground: 203 197 216;  // #cbc5d8
    
    --accent: 246 173 85;             // #F6AD55
    --accent-foreground: 26 26 26;    // #1a1a1a
    
    --destructive: 220 38 38;         // #dc2626
    --destructive-foreground: 255 255 255; // #ffffff
    
    --border: 74 69 96;               // #4a4560
    --input: 74 69 96;                // #4a4560
    
    --ring: 124 115 230;              // #7c73e6
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  // Headings use Noto Serif
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif;
  }
  
  // Body text uses Inter
  p, span, div, a, button, input, textarea, select {
    @apply font-sans;
  }
}

// Custom utilities
@layer utilities {
  // Soft shadow lift effect
  .lift-hover {
    @apply transition-all duration-200 ease-smooth hover:-translate-y-1 hover:shadow-card-hover;
  }
  
  // Focus glow
  .focus-glow {
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
  }
  
  // Purple gradient background
  .gradient-purple {
    @apply bg-gradient-to-br from-primary-100 to-primary-50;
  }
  
  // Text gradient
  .text-gradient-purple {
    @apply bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent;
  }
}
*/
