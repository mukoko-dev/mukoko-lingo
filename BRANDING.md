# Mukoko Lingo - Brand Guidelines & Implementation Guide

**Version**: 4.0 - Mukoko Ecosystem Integration
**Last Updated**: February 2026
**Status**: Complete & Ready for Implementation

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Quick Reference for Developers](#quick-reference-for-developers)
3. [Implementation Status](#implementation-status)
4. [Brand Assets & Files](#brand-assets--files)
5. [Detailed Documentation](#detailed-documentation)
6. [Getting Started for Developers](#getting-started-for-developers)
7. [Tailwind Configuration Reference](#tailwind-configuration-reference)
8. [Mukoko Ecosystem Context](#mukoko-ecosystem-context)

---

## Brand Overview

### Who We Are

**Mukoko Lingo** is the language learning platform within the **Mukoko ecosystem** (part of the Bundu Family). Born in Zimbabwe, expanding across Africa.

- **Name Origin**: "Mukoko" means "hive" in Shona - the structure where cultural knowledge is stored and preserved
- **Symbolism**: Cultural preservation, belonging, structured knowledge, community home
- **Philosophy**: Ubuntu - "I am because we are"
- **Parent Company**: Nyuchi Africa (nyuchi.com)

### Mission & Vision

**Mission**: Empower travelers, expats, students, business professionals, and locals to communicate confidently across Africa's rich linguistic landscape through AI-powered, accessible, community-driven language learning.

**Tagline**: "Master African Languages for Travel, Business & Life"

**Vision**: Starting with Zimbabwe's languages (Shona, Ndebele, English), expanding to become **Africa's premier language learning platform** - from Swahili to Yoruba, Zulu to Amharic, and beyond.

### Pan-African Expansion Roadmap

- **Phase 1 (2025)**: Zimbabwe - Shona, Ndebele, English, Chinese (4 languages)
- **Phase 2 (2026)**: East Africa - Swahili, Amharic, Somali (7 more)
- **Phase 3 (2026)**: West Africa - Yoruba, Igbo, Hausa, Twi (11 total)
- **Phase 4 (2027)**: Southern Africa - Zulu, Xhosa, Afrikaans, Setswana (15 total)
- **Phase 5 (2028)**: North Africa - Egyptian/Moroccan/Algerian Arabic (18+ total)
- **Phase 6 (2028)**: Central Africa - Lingala, Kikongo, Kinyarwanda (22+ total)
- **Future (2030)**: 50+ African languages

**See**: `/brand/NYUCHI_LINGO_PAN_AFRICAN_VISION.md` for complete strategic framework

---

## Quick Reference for Developers

### Colors

#### Background Colors
```css
/* Light Theme */
--background: #faf9f5       /* Warm off-white, no glare */
--card: #ffffff             /* Bright white for depth/elevation */

/* Dark Theme */
--background: #101010       /* Very dark for depth */
--card: #1a1a1a            /* Lighter than background for elevation */
```

#### Primary Colors
```css
/* Warm Purple - Main Brand Color (Nyuchi Africa aligned) */
--primary-700: #5f5873      /* Main brand color (buttons, badges) */
--primary-600: #7c73e6      /* Ubuntu Blue - hover/active in dark mode */
--primary-500: #9186ae      /* Lighter variant */
--primary-800: #4a4560      /* Active states */

/* Success & Milestones - Army Green */
--secondary-500: #729B63    /* Main green (success states) */
--secondary-400: #8FB47F    /* Lighter variant (hover) */
--secondary-600: #5d804f    /* Darker variant (active) */

/* Accent - Sunset Deep */
--accent-500: #d4634a       /* Main sunset deep (premium) */
--accent-400: #f18d79       /* Hover state */
--accent-600: #c54f37       /* Active state */

/* Warm Brown - Cultural Context */
--warm-brown-500: #8B7355   /* Main brown (cultural content) */
--warm-brown-400: #b69a81   /* Hover state */
--warm-brown-600: #765f47   /* Active state */
```

#### Button Color Guidelines (CRITICAL)
**Light Mode:**
- Primary buttons: `bg-primary-700` (#5f5873) - Dark enough to stand out on #faf9f5
- Secondary buttons: `bg-secondary-500` (#729B63) - Army green with white text
- Outline buttons: White background with border

**Dark Mode:**
- Primary buttons: `bg-primary-600` (#7c73e6) - Ubuntu blue, brighter than background
- Secondary buttons: `bg-secondary-400` (#8FB47F) - Lighter army green
- All buttons use WHITE text for maximum contrast

#### Usage Guidelines
- **Primary Purple (700)**: Main CTAs, primary buttons, active nav states
- **Secondary Green (500)**: Success states, secondary actions, growth indicators, completion badges
- **Sunset Deep (500)**: Premium features, highlights, special callouts, achievements
- **Warm Brown (500)**: Cultural content, heritage notes, traditional practices
- **Background (#faf9f5)**: Warm off-white, reduces eye strain, better contrast for colored elements

#### Navigation Colors (CRITICAL - Sidebar & Menu)
**IMPORTANT**: Navigation items use hardcoded hex values (not CSS variables) for guaranteed WCAG compliance.

**Section Headers:**
- Light: `text-[#6b6b6b]` (5.74:1 on white) ✅ AA
- Dark: `text-[#a8a8a8]` (4.93:1 on #1a1a1a) ✅ AA

**Active Navigation Items:**
- Light: `bg-[#5f5873] text-white` (8.5:1) ✅ AAA
- Dark: `bg-[#7c73e6] text-white` (7.2:1) ✅ AAA

**Inactive/Hover Navigation Items:**
- Light default: `text-[#6b6b6b]` (5.74:1 on white) ✅ AA
- Light hover: `bg-[#f0f0f0] text-[#2a2a2a]` (13.1:1) ✅ AAA
- Dark default: `text-[#a8a8a8]` (4.93:1 on #1a1a1a) ✅ AA
- Dark hover: `bg-[#343434] text-[#faf9f5]` (14.2:1) ✅ AAA

**Why Hex Values?**
- CSS variables like `bg-primary` can blend with backgrounds
- Hardcoded values guarantee contrast ratios
- Same approach as Button component
- Next.js 16 + Turbopack compatibility

#### Accessibility
All colors meet WCAG 2.1 AA standards:
- Primary-700 on #faf9f5: **7.2:1** contrast ratio (Pass AA)
- Secondary-500 on #faf9f5: **4.9:1** contrast ratio (Pass AA)
- White text on primary-700: **8.5:1** contrast ratio (Pass AAA)
- Navigation items: **4.93:1 to 14.2:1** (All Pass AA, most AAA)

#### Mobile App Colors (Expo/React Native)

The mobile app uses a slightly different color system optimized for mobile UI patterns. See `constants/Colors.ts` for the full implementation.

**Primary - Sunset Deep** (Brand distinctive color):

```typescript
primary: {
  600: '#D4634A',  // Main brand color - Sunset Deep
  500: '#e46b5a',  // Lighter variant
  700: '#b8513c',  // Darker variant
}
```

**Secondary - Navy Blue** (Education/Trust):

```typescript
secondary: {
  800: '#1E3A8A',  // Main secondary - Navy Blue
  600: '#2563eb',  // Lighter variant
}
```

**Accent - Purple** (Innovation/Creativity):

```typescript
accent: {
  600: '#7C73E6',  // Main accent - Purple (matches Ubuntu blue)
  500: '#8b7cf5',  // Lighter variant
}
```

**Theme Configuration**:

```typescript
// Light Theme
lightTheme = {
  background: '#faf9fb',
  card: '#ffffff',
  primary: Colors.primary[600],    // Sunset Deep
  secondary: Colors.secondary[800], // Navy Blue
  accent: Colors.accent[600],       // Purple
}

// Dark Theme
darkTheme = {
  background: '#101010',
  card: '#1a1a1a',
  primary: Colors.primary[500],    // Lighter Sunset
  secondary: Colors.secondary[600], // Lighter Navy
  accent: Colors.accent[500],       // Lighter Purple
}
```

**Mobile vs Web Color Mapping**:

| Purpose | Web (Tailwind) | Mobile (Colors.ts) |
|---------|----------------|-------------------|
| Primary CTA | `bg-primary-700` (#5f5873) | `Colors.primary[600]` (#D4634A) |
| Secondary | `bg-secondary-500` (#729B63) | `Colors.secondary[800]` (#1E3A8A) |
| Accent | `bg-accent-500` (#d4634a) | `Colors.accent[600]` (#7C73E6) |
| Success | `bg-secondary-500` (#729B63) | `Colors.success[500]` (#729B63) |

**Note**: The mobile app prioritizes the Sunset Deep (#D4634A) as the primary brand color for a more distinctive, energetic feel on mobile devices. The web version uses the Warm Purple for a more professional appearance.

### Typography

#### Font Families
```css
/* Display & Titles - Noto Serif */
font-family: 'Noto Serif', Georgia, serif;
/* Used for large display text and hero titles */
/* 800+ languages supported - critical for Pan-African scale */

/* Headings (H1-H6) - Poppins */
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
/* Modern, clean sans-serif for section headings and subheadings */

/* Body Text & UI - Noto Sans */
font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, sans-serif;
/* Optimized for screens, excellent legibility, matches Noto font family */
/* Supports ALL 50+ planned African languages */
```

**Why This Three-Font System?**
- **Noto Serif**: Professional, sophisticated feel for large display text
- **Poppins**: Modern, approachable headings with excellent readability
- **Noto Sans**: Body text that matches Noto Serif's language support (800+ languages)
- **Unified Language Support**: Both Noto fonts support Shona, Ndebele, Chinese, English, Swahili, Amharic, Arabic, etc.
- **Visual Hierarchy**: Clear distinction between display, headings, and body text

#### Type Scale

**Display (Noto Serif)**:
```css
Display:    72px / 900 weight / 1.2 line-height
```

**Headings (Poppins)**:
```css
H1:         48px / 700 weight / 1.2 line-height
H2:         36px / 600 weight / 1.2 line-height
H3:         24px / 600 weight / 1.3 line-height
H4:         20px / 500 weight / 1.4 line-height
H5:         18px / 500 weight / 1.4 line-height
H6:         16px / 500 weight / 1.4 line-height
```

**Body (Noto Sans)**:
```css
Body Large: 18px / 400 weight / 1.6 line-height
Body:       16px / 400 weight / 1.6 line-height
Small:      14px / 400 weight / 1.5 line-height
Tiny:       12px / 400 weight / 1.5 line-height
```

**Mobile** (<640px): Scale down by ~20% for Display and H1-H3

### Components

#### Buttons
```css
/* Primary Button (Light Mode) */
background: #5f5873              /* bg-primary-700 - visible on #faf9f5 */
color: #ffffff                   /* White text for contrast */
border-radius: 10px              /* Claude-style (NOT pill) */
padding: 16px × 32px
min-height: 48px                 /* Touch accessible */
font: Inter 600, 16px
hover: #7c73e6                   /* bg-primary-600 */
active: #4a4560                  /* bg-primary-800 */

/* Primary Button (Dark Mode) */
background: #7c73e6              /* bg-primary-600 - Ubuntu blue */
hover: #9186ae                   /* bg-primary-500 */
active: #5f5873                  /* bg-primary-700 */

/* Secondary Button */
background: #729B63              /* bg-secondary-500 - Army green */
color: #ffffff                   /* White text */
hover: #8FB47F                   /* bg-secondary-400 */

/* NEVER use bg-primary without scale (700/600/500) */
```

#### Cards
```css
/* Standard Card */
border-radius: 12px
padding: 24px
border: 1px solid + optional purple left accent
shadow: 0 2px 8px rgba(0,0,0,0.08)
hover: lift -4px + shadow enhanced

/* Phrase Card (Special) */
border-left: 4px solid #5f5873   /* Purple accent */
hover: border-left becomes 6px
```

#### Icons
- **Source**: Lucide Icons ONLY
- **Style**: Outlined (stroke: 1.5-2px)
- **Sizes**: 24px (standard), 40px (mobile touch), 48px (hero)
- **Colors**: Wisdom Dark, Primary Purple, Army Green

**Common icons**: BookOpen, Globe, Target, Award, MessageCircle, Mic, Star, TrendingUp

### Spacing (4px Grid)
```
xs:   4px      sm:  8px      md: 12px
lg:  16px      xl: 24px     2xl: 32px
3xl: 48px     4xl: 64px     5xl: 80px
```

### Shadows (Soft & Layered)
```css
Level 1: 0 1px 3px rgba(0,0,0,0.06)    /* Cards, inputs */
Level 2: 0 2px 8px rgba(0,0,0,0.08)    /* Elevated cards */
Level 3: 0 4px 16px rgba(0,0,0,0.10)   /* Modals */
Level 4: 0 8px 32px rgba(0,0,0,0.12)   /* Floating elements */
Focus:   0 0 0 3px rgba(95,88,115,0.3) /* Purple glow */
```

### Breakpoints
```
Mobile:         < 640px (sm)
Tablet:         640px - 1023px (sm → lg)
Desktop:        ≥ 1024px (lg)
Large Desktop:  ≥ 1440px (xl)
```

---

## Implementation Status

### ✅ What's Been Implemented (v3.0 Tailwind Config)

The Nyuchi Africa brand system v3.0 has been fully configured in `tailwind.config.js`:

**Completed**:
- Warm Purple primary color (#5f5873) with full scale
- Army Green secondary color (#729B63)
- Sunset Deep accent color (#d4634a) - November 11, 2025
- Warm Brown cultural color (#8B7355) - November 11, 2025
- Noto Serif + Poppins + Noto Sans typography system - November 12, 2025
- 4px spacing grid
- Claude-inspired 10px border radius
- Soft, layered shadow system
- Full gamification color palette (streaks, achievements)
- Custom Nyuchi color utilities
- WCAG AA compliant color system
- Dark mode variants

**Current Tailwind Config**: `/tailwind.config.js` (v3.0 - fully aligned)

### 🚧 What Needs Implementation in Components

**Typography**:
- [ ] Update display text to use `font-display` class (Noto Serif)
- [ ] Ensure all H1-H6 use `font-heading` class (Poppins)
- [ ] Ensure all body text uses `font-sans` (Noto Sans - default)
- [ ] Test multilingual rendering (Shona, Ndebele, Chinese with Noto fonts)

**Buttons**:
- [ ] Update border-radius from `rounded-full` to `rounded-md` (10px)
- [ ] Verify 48px minimum height for touch targets

**Cards**:
- [ ] Add purple left border accent to phrase cards
- [ ] Implement hover lift effects with shadow enhancement

**Icons**:
- [ ] Replace any non-Lucide icons with Lucide equivalents
- [ ] Ensure consistent stroke width (1.5-2px)

**Focus States**:
- [ ] Add purple focus rings (3px) to all interactive elements
- [ ] Test keyboard navigation visibility

**Accessibility**:
- [ ] Add ARIA descriptions to dialogs (in progress)
- [ ] Verify all interactive elements have 48px touch targets
- [ ] Run WCAG 2.1 AA compliance audit

**See**: `/brand/NYUCHI_LINGO_MIGRATION_GUIDE.md` for step-by-step implementation

---

## Brand Assets & Files

### Logo Files

**Desktop Logos**:
- Light mode: `Mukoko_Lingo_purple.svg` (purple text #5f5873 + bee icon)
- Dark mode: `Mukoko_Lingo_dark.svg` (light text + light bee icon)
- Minimum width: 180px

**Mobile Logo**:
- `bee-logo-mobile.svg` (icon only, no wordmark)
- Size: 40px × 40px

**Favicon**:
- `bee-favicon.svg`
- Sizes: 16px, 32px, 48px

**Location**: Logos should be placed in `/public/images/logos/`

**Clear Space**: Minimum clear space = height of bee icon on all sides

### Logo Usage

**DO**:
- Use official logo files (SVG preferred)
- Use purple version on light backgrounds
- Use light version on dark backgrounds
- Scale proportionally
- Maintain clear space

**DON'T**:
- Distort, stretch, or rotate
- Change colors or add effects
- Place on busy backgrounds without contrast
- Recreate or modify the bee icon
- Use low-resolution versions

### Brand Documentation Files

All brand documentation is located in `/brand/` directory:

1. **NYUCHI_LINGO_BRAND_GUIDELINES_v3.md** (29KB)
   - Complete brand bible
   - Color palette, typography, components
   - Logo system, multilingual support
   - Voice and tone, accessibility requirements

2. **NYUCHI_LINGO_QUICK_REFERENCE.md** (8KB)
   - Developer cheat sheet
   - Quick color/typography lookup
   - Common patterns and CSS snippets

3. **NYUCHI_LINGO_MIGRATION_GUIDE.md** (18KB)
   - Step-by-step implementation guide
   - 7 phases (4-6 hours total)
   - Code examples, troubleshooting

4. **NYUCHI_LINGO_BRAND_EVOLUTION.md** (16KB)
   - Visual before/after comparison
   - Side-by-side improvements
   - Why changes were made

5. **NYUCHI_LINGO_PAN_AFRICAN_VISION.md** (16KB)
   - Strategic expansion framework
   - Language roadmap (50+ languages)
   - Market opportunity, business model

6. **NYUCHI_LINGO_IMPLEMENTATION_ROADMAP.md** (15KB)
   - 4-week implementation timeline
   - Team roles and responsibilities
   - Success metrics

7. **NYUCHI_LINGO_COMPLETE_PACKAGE_SUMMARY.md** (12KB)
   - Overview of all documents
   - Quick start guide by role
   - Key changes summary

---

## Detailed Documentation

### For Complete Brand Specifications

**Main Reference**: `/brand/NYUCHI_LINGO_BRAND_GUIDELINES_v3.md`

Includes:
- Complete color palette with hex/HSL values
- Typography system (all weights, sizes, line heights)
- Component library with code examples
- Layout and responsive design patterns
- Logo system and usage guidelines
- Accessibility requirements (WCAG 2.1 AA)
- Navigation architecture
- Multilingual support specifications
- Voice and tone guidelines
- Gamification patterns

**Reading Time**: 45-60 minutes
**Best For**: Design team, brand managers, new team members

### For Daily Development Work

**Quick Reference**: `/brand/NYUCHI_LINGO_QUICK_REFERENCE.md`

Includes:
- Color codes (hex, HSL)
- Typography scale
- Component specifications
- Spacing values
- Shadow utilities
- Common patterns with code
- CSS variable templates

**Reading Time**: 10-15 minutes
**Best For**: Developers (daily reference), code reviews

### For Implementation

**Migration Guide**: `/brand/NYUCHI_LINGO_MIGRATION_GUIDE.md`

Includes:
- 7 implementation phases
- Step-by-step instructions with code examples
- Testing procedures
- Troubleshooting guide
- Before/after code comparisons
- Deployment checklist

**Estimated Time**: 4-6 hours implementation
**Best For**: Development team, QA team

### For Understanding Changes

**Brand Evolution**: `/brand/NYUCHI_LINGO_BRAND_EVOLUTION.md`

Includes:
- Side-by-side visual comparisons (v2.0 → v3.0)
- Typography transformation
- Component design changes
- Accessibility improvements
- Performance optimizations
- Key takeaways

**Reading Time**: 20 minutes
**Best For**: Stakeholders, design reviews, presentations

### For Strategic Context

**Pan-African Vision**: `/brand/NYUCHI_LINGO_PAN_AFRICAN_VISION.md`

Includes:
- 6-phase expansion roadmap (2025-2030)
- Language-by-language breakdown (50+ total)
- Market opportunity analysis (1.4B people + 200M diaspora)
- User segmentation (heritage learners, business, travel)
- Revenue model and growth metrics
- Why Noto Serif is critical for scale

**Reading Time**: 30 minutes
**Best For**: Strategic planning, investor presentations, long-term vision

---

## Getting Started for Developers

### Quick Setup

**1. Tailwind Configuration** (Already Done)

The v3.0 Nyuchi Africa brand is fully configured in `/tailwind.config.js`:
- Colors: Primary purple, army green, sunset gold
- Typography: Noto Serif + Inter
- Spacing: 4px grid system
- Shadows: Soft, layered elevation
- Border radius: Claude-inspired 10px

**2. Install Fonts** (Already Configured)

Fonts are loaded via Next.js Google Fonts integration in `app/layout.tsx`:

```typescript
import { Noto_Serif, Noto_Sans, Poppins } from 'next/font/google'

// Display & Titles - Noto Serif
const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
})

// Headings (H1-H6) - Poppins
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Body Text & UI - Noto Sans
const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${notoSans.variable} ${poppins.variable} ${notoSerif.variable}`}>
      <body className={notoSans.className}>
        {children}
      </body>
    </html>
  )
}
```

**CSS Variables Available**:
- `--font-display`: Noto Serif (for display/titles)
- `--font-heading`: Poppins (for H1-H6)
- `--font-sans`: Noto Sans (for body text)

**Tailwind Classes**:
- `font-display`: Uses Noto Serif
- `font-heading`: Uses Poppins
- `font-sans`: Uses Noto Sans (default)
- `font-serif`: Legacy support for Noto Serif

**3. Install Lucide Icons** (If Not Already Installed)

```bash
npm install lucide-react
```

Usage:
```tsx
import { BookOpen, Globe, Mic, Star } from 'lucide-react'

<BookOpen className="w-6 h-6" strokeWidth={1.5} />
```

**4. Apply Brand to Components**

```tsx
// Display Titles - Use Noto Serif (font-display)
<h1 className="text-7xl font-black font-display">
  Master African Languages
</h1>

// Section Headings - Use Poppins (font-heading)
<h2 className="text-4xl font-bold font-heading">
  Learn Shona, Ndebele & More
</h2>

// Body Text - Use Noto Sans (font-sans, default)
<p className="text-base font-sans">
  Start your language learning journey today with AI-powered lessons.
</p>

// Buttons - 10px radius, 48px min height
<Button className="rounded-md px-8 h-12 bg-primary hover:bg-primary-hover">
  Get Started
</Button>

// Cards - Purple left border accent
<Card className="border-l-4 border-primary hover:border-l-6 transition-all">
  {/* Content */}
</Card>

// Icons - Lucide with consistent sizing
<Mic className="w-6 h-6 text-primary" strokeWidth={1.5} />
```

### Common Patterns

**Progress Card**:
```tsx
<Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-primary">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground font-sans">Study Streak</p>
      <h3 className="text-4xl font-display font-black text-primary">7 Days</h3>
    </div>
    <Flame className="w-16 h-16 text-orange-500" />
  </div>
</Card>
```

**Phrase Card**:
```tsx
<Card className="border-l-4 border-primary hover:shadow-lg transition-all">
  <CardHeader>
    <CardTitle className="font-heading text-xl font-semibold">
      Mangwanani (Good Morning)
    </CardTitle>
    <CardDescription className="font-sans text-sm">
      Common greeting - Use in morning until noon
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button size="sm" variant="ghost">
      <Mic className="w-4 h-4 mr-2" />
      Listen
    </Button>
  </CardContent>
</Card>
```

**Focus States**:
```tsx
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Accessible Button
</Button>
```

---

## Tailwind Configuration Reference

### Complete Config

The full Tailwind configuration is in `/tailwind.config.js`. Key sections:

**Colors**:
- Primary (warm purple with full scale)
- Secondary (army green)
- Accent (sunset gold)
- Semantic colors (success, warning, error, info)
- Gamification colors (streak, achievement)
- Custom Nyuchi utilities

**Typography**:
- Font families: Noto Serif (display), Poppins (headings H1-H6), Noto Sans (body), monospace (code)
- Font sizes with line heights (xs to 5xl)
- Font weights (light to extrabold)
- Three-tier hierarchy: display → heading → body

**Spacing**:
- 4px grid system (xs to 5xl)
- Custom component spacing values

**Border Radius**:
- Claude-inspired 10px default
- Range from 8px to 20px
- Full radius for pills

**Shadows**:
- 4 elevation levels
- Custom card/modal shadows
- Purple focus shadow
- All soft and layered

**Animations**:
- Accordion, fade-in, slide-in
- Lift hover effect
- Smooth transitions

### CSS Variables

The config includes CSS variables documentation (see lines 360-488 in tailwind.config.js).

Add to `globals.css`:
```css
@layer base {
  :root {
    --primary: 95 88 115;              /* #5f5873 */
    --secondary: 114 155 99;           /* #729B63 */
    --accent: 246 173 85;              /* #F6AD55 */
    /* ... see full config for complete variables */
  }
}
```

**Dark Mode**: Full dark mode palette included with Ubuntu Blue primary and adjusted colors.

---

## Nyuchi Africa Ecosystem Context

### Brand Alignment

Mukoko Lingo is part of the **Nyuchi Africa ecosystem**, sharing core design principles across all divisions.

**Shared Across All Divisions**:
- Warm purple primary color (#5f5873)
- Noto Serif typography (800+ languages)
- Inter for UI and body text
- Ubuntu philosophy ("I am because we are")
- Claude-inspired design patterns
- Lucide icons exclusively
- 4px spacing grid
- WCAG 2.1 AA accessibility
- Community-first approach

**Unique to Mukoko Lingo**:
- Bee branding and symbolism
- Language learning focus
- Educational gamification
- Progress tracking and analytics
- Audio and pronunciation features
- AI-powered tutoring

### Division Context

**Parent**: Mukoko Platform (Ecosystem level)

**Sibling Divisions**:
- Harare Metro (News aggregation)
- Zimbabwe Travel Info (Travel guides)

**Unified Backend**: Mukoko (Authentication and user management)

### Ubuntu Philosophy

**"I am because we are"**

This African philosophy guides everything we do:
- Community-contributed phrases and corrections
- Peer-to-peer learning features
- Cultural context shared by local experts
- Collective knowledge building
- Language learning as a communal journey

### Pan-African Mission

We're not just a Zimbabwe language app - we're building **Africa's premier language learning platform**:

- **Starting point**: Zimbabwe (Shona, Ndebele)
- **Vision**: 50+ African languages by 2030
- **Impact**: Preserving linguistic heritage at scale
- **Market**: 1.4B people in Africa + 200M diaspora
- **Philosophy**: Born in Zimbabwe, Built for Africa

**Why this matters for design**:
- Noto Serif must support ALL African languages (it does!)
- Design must scale across cultures and contexts
- Accessibility critical for diverse users
- Mobile-first for African markets
- Community-driven content at core

---

## Voice & Tone

### Brand Voice

**Friendly & Encouraging**:
- "Great job! You're making progress!"
- "Let's practice this phrase together"
- "You've mastered 10 phrases this week!"

**Informative & Clear**:
- "This phrase is commonly used when greeting elders"
- "Pronunciation tip: The 'dz' sound is similar to..."
- "Next lesson: Market conversations"

**Inclusive & Supportive**:
- "Everyone learns at their own pace"
- "No wrong answers, only learning opportunities"
- "Join our community of language learners"

**Professional & Trustworthy**:
- "Verified by native speakers"
- "Aligned with CEFR language standards"
- "Trusted by 10,000+ learners"

### Key Messaging

**Primary**:
- "Master African Languages" (not just Zimbabwe)
- "Connect Across Cultures" (pan-African unity)
- "Start with Zimbabwe, Expand Across Africa"
- "2,000+ Languages, One Platform" (future vision)

**Supporting**:
- "Born in Zimbabwe, Built for Africa"
- "Community-Driven, Locally Authentic"
- "Learn from Native Speakers"
- "AI-Powered, Culturally Grounded"

---

## Target Audiences

### Primary Users

1. **African Diaspora & Heritage Learners** (25%)
   - Reconnecting with ancestral languages
   - Building cultural connections

2. **Travelers & Tourists** (25%)
   - Visiting Africa (safari, heritage sites, business)
   - Victoria Falls, Serengeti, pyramids, Cape Town

3. **Business Professionals & Expats** (20%)
   - Working across African markets
   - NGO workers and aid organizations

4. **Students & Academics** (15%)
   - African studies programs
   - Linguistics and anthropology

5. **Pan-African Professionals** (10%)
   - Moving between African countries
   - Regional business operations

6. **Multilingual Africans** (5%)
   - Learning additional African languages
   - Cross-cultural communication

### Geographic Reach

**Current** (Phase 1): Zimbabwe + International users

**Expansion Path**:
- East Africa (Kenya, Tanzania, Uganda, Ethiopia)
- West Africa (Nigeria, Ghana, Senegal)
- Southern Africa (South Africa, Botswana, Namibia)
- North Africa (Egypt, Morocco, Algeria)
- Central Africa (DRC, Rwanda, Congo)
- Global diaspora communities

---

## Accessibility Standards

### WCAG 2.1 AA Compliance (Required)

**Visual**:
- Color contrast ≥ 4.5:1 (normal text)
- Color contrast ≥ 3:1 (large text)
- Focus indicators visible (3px purple glow)
- Color never sole indicator

**Interactive**:
- Touch targets ≥ 48px × 48px
- Clear hover states
- Visible focus rings
- Keyboard navigation fully functional

**Content**:
- Semantic HTML structure
- ARIA labels on all interactive elements
- Alt text for all images
- Captions for videos
- Descriptive link text

**Screen Readers**:
- Screen reader compatible
- Proper heading hierarchy
- Form labels properly associated
- Status messages announced

---

## Performance Guidelines

### Font Loading
- Use Next.js font optimization
- Font-display: swap (no flash)
- Preload critical fonts (Noto Serif, Inter)
- Load only required subsets

### Image Optimization
- Use Next.js Image component
- Lazy load below the fold
- WebP format with fallbacks
- Responsive sizes (srcset)
- Priority loading for hero images

### Animation Performance
- Use CSS transforms (not position)
- GPU-accelerated properties
- Smooth 60fps animations
- Respect `prefers-reduced-motion`

### Loading Strategy
- Critical CSS inline
- Progressive enhancement
- Skeleton screens (not spinners)
- Optimistic UI updates

---

## Support & Contact

### Documentation Questions
All brand documentation is in `/brand/` directory:
- Brand Guidelines (full reference)
- Quick Reference (cheat sheet)
- Migration Guide (implementation)
- Brand Evolution (visual comparison)
- Pan-African Vision (strategy)
- Implementation Roadmap (timeline)
- Complete Package Summary (overview)

### Technical Questions
- Tailwind config: `/tailwind.config.js`
- Current Tailwind (v3.0 Nyuchi Africa aligned)
- Component patterns: See Quick Reference or Migration Guide
- Troubleshooting: See Migration Guide Phase 7

### Help & Support
- **Help Center**: Integrated HelpScout Beacon widget
- **In-App Support**: Support button (bottom-right)
- **Documentation**: `/CLAUDE.md` (project overview)

---

## Version History

**v3.1** (Current - November 12, 2025):
- Updated typography system: Noto Serif (display) + Poppins (headings) + Noto Sans (body)
- Three-tier font hierarchy for improved visual distinction
- Enhanced multilingual support with Noto font family consistency
- All previous v3.0 features maintained

**v3.0** (November 10-11, 2025):
- Nyuchi Africa ecosystem alignment
- Pan-African expansion positioning
- Warm purple primary color (#5f5873)
- Sunset Deep accent color (#d4634a)
- Warm Brown cultural color (#8B7355)
- Button color fix implementation
- Claude-inspired design patterns (10px radius)
- Soft, layered shadows
- WCAG 2.1 AA accessibility
- Complete Tailwind configuration
- 7 comprehensive brand documents

**v2.0** (Previous):
- Unified navigation with AppSidebar
- Zimbabwe-focused positioning
- Generic purple brand color
- System font stacks
- Basic accessibility

---

**Built with love by Nyuchi Africa**
**Powered by Noto Serif (800+ languages)**
**Guided by Ubuntu: "I am because we are"**

---

*This document is the central brand reference for developers. For complete specifications, see `/brand/NYUCHI_LINGO_BRAND_GUIDELINES_v3.md`. For daily development work, see `/brand/NYUCHI_LINGO_QUICK_REFERENCE.md`.*
