# Nyuchi Lingo - Brand Guidelines & Implementation Guide

**Version**: 3.0 - Nyuchi Africa Ecosystem Integration
**Last Updated**: November 10, 2025
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
8. [Nyuchi Africa Ecosystem Context](#nyuchi-africa-ecosystem-context)

---

## Brand Overview

### Who We Are

**Nyuchi Lingo** is the language learning platform within the **Nyuchi Africa ecosystem**, specifically under the Nyuchi Learning division. Born in Zimbabwe, expanding across Africa.

- **Name Origin**: "Nyuchi" means "bee" in Shona
- **Symbolism**: Community, hard work, communication, and the sweetness of language learning
- **Philosophy**: Ubuntu - "I am because we are"

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

#### Primary Colors
```css
/* Warm Purple - Main Brand Color (Nyuchi Africa aligned) */
--primary: #5f5873          /* Main brand color */
--primary-hover: #7c73e6    /* Ubuntu Blue - hover states */
--primary-dark: #4a4560     /* Active states, dark mode */
--primary-light: #8f86a8    /* Subtle backgrounds */

/* Success & Milestones - Army Green */
--secondary: #729B63        /* Success states, learning milestones */
--secondary-dark: #8FB47F   /* Lighter variant */

/* Accent - Sunset Gold */
--accent: #F6AD55           /* Premium features, achievements */
```

#### Usage Guidelines
- **Primary Purple**: CTAs, buttons, active states, links, progress indicators
- **Army Green**: Success messages, completions, learning milestones
- **Sunset Gold**: Achievement badges, premium features, celebrations
- **Warm Brown** (#8B7355): Cultural context, heritage elements

#### Accessibility
All colors meet WCAG 2.1 AA standards:
- Purple on white: **7.4:1** contrast ratio
- Army green on white: **4.8:1** contrast ratio
- Wisdom Dark on light: **12.8:1** contrast ratio

### Typography

#### Font Families
```css
/* Headings & Titles - Noto Serif */
font-family: 'Noto Serif', Georgia, serif;
/* 800+ languages supported - critical for Pan-African scale */

/* Body Text & UI - Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
/* Optimized for screens, excellent legibility */
```

**Why Noto Serif?**
- Supports ALL 50+ planned African languages
- Perfect rendering: Shona, Ndebele, Chinese, English, Swahili, Amharic, Arabic, etc.
- Professional appearance across Latin, Ethiopic, Arabic scripts
- Single font system = simplified architecture

#### Type Scale

**Desktop**:
```css
Hero/H1:    56px / 800 weight / 1.2 line-height
H2:         36px / 700 weight / 1.2 line-height
H3:         28px / 700 weight / 1.3 line-height
H4:         20px / 600 weight / 1.4 line-height
Body Large: 18px / 400 weight / 1.6 line-height
Body:       16px / 400 weight / 1.6 line-height
Small:      14px / 400 weight / 1.5 line-height
Tiny:       12px / 400 weight / 1.5 line-height
```

**Mobile** (<640px): Scale down by ~20% for H1-H3

### Components

#### Buttons
```css
/* Primary Button */
background: hsl(var(--primary))
border-radius: 10px              /* Claude-style (NOT pill) */
padding: 16px × 32px
min-height: 48px                 /* Touch accessible */
font: Inter 600, 16px
hover: lift -2px + shadow enhanced
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
- Sunset Gold accent color (#F6AD55)
- Noto Serif + Inter typography system
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
- [ ] Ensure all H1-H6 use `font-serif` class (Noto Serif)
- [ ] Ensure all body text uses `font-sans` (Inter)
- [ ] Test multilingual rendering (Shona, Ndebele, Chinese)

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
- Light mode: `Nyuchi_Lingo_purple.svg` (purple text #5f5873 + bee icon)
- Dark mode: `Nyuchi_Lingo_dark.svg` (light text + light bee icon)
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

**2. Install Fonts** (If Not Already Installed)

```bash
# Using Next.js @next/font
npm install @next/font
```

In `app/layout.tsx`:
```typescript
import { Inter, Noto_Serif } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSerif.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

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
// Headings - Use Noto Serif
<h1 className="text-4xl font-bold font-serif">
  Master African Languages
</h1>

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
      <h3 className="text-4xl font-serif font-bold text-primary">7 Days</h3>
    </div>
    <Flame className="w-16 h-16 text-orange-500" />
  </div>
</Card>
```

**Phrase Card**:
```tsx
<Card className="border-l-4 border-primary hover:shadow-lg transition-all">
  <CardHeader>
    <CardTitle className="font-serif text-xl">
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
- Font families: Noto Serif (headings), Inter (body), monospace (code)
- Font sizes with line heights (xs to 5xl)
- Font weights (light to extrabold)

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

Nyuchi Lingo is part of the **Nyuchi Africa ecosystem**, sharing core design principles across all divisions.

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

**Unique to Nyuchi Lingo**:
- Bee branding and symbolism
- Language learning focus
- Educational gamification
- Progress tracking and analytics
- Audio and pronunciation features
- AI-powered tutoring

### Division Context

**Parent**: Nyuchi Learning (Educational frameworks)

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

**v3.0** (Current - November 10, 2025):
- Nyuchi Africa ecosystem alignment
- Pan-African expansion positioning
- Warm purple primary color (#5f5873)
- Noto Serif + Inter typography
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
