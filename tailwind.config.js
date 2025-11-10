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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
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
        
        // Accent - Sunset Gold
        accent: {
          DEFAULT: "#F6AD55",
          foreground: "#1a1a1a",
          50: '#fef8f0',
          100: '#feefd9',
          200: '#fddbb2',
          300: '#fbc181',
          400: '#f99d4e',
          500: '#F6AD55',
          600: '#f47420',
          700: '#d95d16',
          800: '#b04a16',
          900: '#8f3e17',
        },
        
        // Semantic colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
          'sunset-gold': '#F6AD55',
          'wisdom-dark': '#1a1a1a',
        },
      },
      
      // ====================
      // TYPOGRAPHY - Noto Serif + Inter
      // ====================
      fontFamily: {
        // Headings - Noto Serif (800+ languages)
        serif: [
          'Noto Serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
        // Body & UI - Inter
        sans: [
          'Inter',
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
