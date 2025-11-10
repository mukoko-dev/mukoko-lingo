# Nyuchi Lingo - Brand Migration Guide
## From v2.0 to v3.0 (Nyuchi Africa Alignment)

**Version**: 3.0  
**Date**: November 10, 2025  
**Estimated Time**: 4-6 hours implementation

---

## 📋 Migration Overview

This guide will help you transition Nyuchi Lingo from its current branding to the new Nyuchi Africa-aligned system, focusing on:
1. Typography updates (Noto Serif + Inter)
2. Color system alignment (Warm Purple primary)
3. Component refinements (Claude-inspired patterns)
4. Logo updates
5. Accessibility improvements

---

## 🎯 Phase 1: Typography Migration (1-2 hours)

### Step 1.1: Install Noto Serif

**In your project root:**
```bash
# If using Next.js with @next/font
npm install @next/font
```

**Update `app/layout.tsx` or `_app.tsx`:**
```typescript
import { Inter, Noto_Serif } from 'next/font/google'

// Inter for body text and UI
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Noto Serif for headings
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

### Step 1.2: Update Tailwind Config

**Add font families to `tailwind.config.js`:**
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

### Step 1.3: Update Component Classes

**Find and replace across codebase:**

| Current | Replace With |
|---------|--------------|
| `font-sans` on headings | `font-serif` |
| Generic serif references | `font-serif` |
| Check all `<h1>` to `<h6>` | Add `font-serif` class |

**Example component update:**
```tsx
// BEFORE
<h1 className="text-4xl font-bold">
  Master Zimbabwe's Languages
</h1>

// AFTER
<h1 className="text-4xl font-bold font-serif">
  Master Zimbabwe's Languages
</h1>
```

### Step 1.4: Test Multilingual Rendering

**Test pages with:**
- ✅ English content
- ✅ Shona phrases
- ✅ Ndebele phrases  
- ✅ Chinese characters

**Check:**
- Character rendering quality
- Font fallback behavior
- No font flash (FOUT/FOIT)

---

## 🎨 Phase 2: Color System Update (2-3 hours)

### Step 2.1: Update CSS Variables

**In `globals.css`, replace:**

```css
/* OLD - Remove these */
--primary: [old value];
--primary-hover: [old value];

/* NEW - Add these */
:root {
  --primary: 95 88 115;              /* #5f5873 - Warm Purple */
  --primary-hover: 124 115 230;      /* #7c73e6 - Ubuntu Blue */
  --primary-dark: 74 69 96;          /* #4a4560 */
  --primary-light: 143 134 168;      /* #8f86a8 */
  
  --secondary: 114 155 99;           /* #729B63 - Army Green */
  --secondary-dark: 143 180 127;     /* #8FB47F */
  
  --accent: 246 173 85;              /* #F6AD55 - Sunset Gold */
  
  /* Keep existing semantic colors */
  --success: 16 185 129;             /* #10b981 */
  --warning: 245 158 11;             /* #f59e0b */
  --error: 239 68 68;                /* #ef4444 */
  --info: 59 130 246;                /* #3b82f6 */
}
```

### Step 2.2: Update Tailwind Config Colors

**Replace the `tailwind.config.js` colors section with the provided config from `tailwind.config.nyuchi-lingo.js`**

### Step 2.3: Search & Replace Component Colors

**Run these find/replace operations:**

| Find (Old) | Replace (New) | Context |
|------------|---------------|---------|
| Primary button colors | `bg-primary hover:bg-primary-hover` | Buttons, CTAs |
| Success indicators | `bg-secondary` or `text-secondary` | Use army green |
| Achievement badges | `bg-accent` | Use sunset gold |
| Purple shades | Map to new purple scale | Throughout |

### Step 2.4: Audit Color Contrast

**Use WebAIM Contrast Checker:**
```
Test these combinations:
✅ Purple (#5f5873) on white → Should be 7.4:1
✅ Purple on light backgrounds
✅ White text on purple buttons
✅ Army green on white → Should be 4.8:1
✅ All text meets WCAG AA (4.5:1 minimum)
```

**Fix any failing combinations:**
```tsx
// If contrast fails, use darker variants
className="bg-primary-700" // Instead of bg-primary-500
```

---

## 🧩 Phase 3: Component Updates (1-2 hours)

### Step 3.1: Update Button Border Radius

**Find all button components and update:**

```tsx
// BEFORE (pill-shaped)
<Button className="rounded-full px-8 py-4">
  Get Started
</Button>

// AFTER (Claude-inspired 10px radius)
<Button className="rounded-[10px] px-8 py-4">
  Get Started
</Button>
```

**Or use Tailwind's `rounded-md` if you set default radius to 10px:**
```tsx
<Button className="rounded-md px-8 py-4">
  Get Started
</Button>
```

### Step 3.2: Update Card Components

**Standard card with purple left border:**

```tsx
// BEFORE
<Card className="rounded-lg p-6 border">
  {/* Content */}
</Card>

// AFTER (with purple accent border)
<Card className="rounded-lg p-6 border-l-4 border-primary hover:border-l-6 transition-all">
  {/* Content */}
</Card>
```

**Phrase cards (special treatment):**
```tsx
<Card className="rounded-lg p-5 border-l-4 border-primary shadow-level-2 hover:shadow-card-hover hover:-translate-y-1 transition-all">
  <CardHeader>
    <CardTitle className="font-serif text-xl">
      Mangwanani
    </CardTitle>
    <CardDescription className="font-sans text-sm text-muted-foreground">
      Good Morning - Use until noon
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Phrase details */}
  </CardContent>
</Card>
```

### Step 3.3: Replace Icons with Lucide

**Install Lucide (if not already):**
```bash
npm install lucide-react
```

**Replace icon imports:**
```tsx
// BEFORE (example with Heroicons or other)
import { BookOpenIcon } from '@heroicons/react/24/outline'

// AFTER (Lucide)
import { BookOpen } from 'lucide-react'
```

**Common icon mappings:**

| Old Icon | Lucide Equivalent |
|----------|-------------------|
| BookOpenIcon | BookOpen |
| GlobeIcon | Globe |
| UsersIcon | Users |
| SmartphoneIcon | Smartphone |
| DownloadIcon | Download |
| MapPinIcon | MapPin |
| BusIcon | Bus |
| AlertCircleIcon | AlertCircle |
| MicrophoneIcon | Mic |
| StarIcon | Star |

**Icon sizing:**
```tsx
// Standard size
<BookOpen className="w-6 h-6" />  // 24px

// Mobile touch size
<BookOpen className="w-10 h-10" /> // 40px

// Hero size
<BookOpen className="w-12 h-12" /> // 48px

// Stroke width
<BookOpen className="w-6 h-6" strokeWidth={1.5} />
```

### Step 3.4: Update Shadows

**Replace shadow classes:**

```tsx
// BEFORE
className="shadow-md"

// AFTER (Nyuchi soft shadows)
className="shadow-level-2"

// Available shadow utilities:
shadow-level-1  // Subtle (cards, inputs)
shadow-level-2  // Standard elevation
shadow-level-3  // Modals, dropdowns
shadow-level-4  // Floating elements
shadow-card     // Cards
shadow-card-hover // Card hover state
```

**Add hover lift effects:**
```tsx
<Card className="shadow-level-2 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
  {/* Lifts 4px on hover with enhanced shadow */}
</Card>
```

---

## 🖼️ Phase 4: Logo Updates (30 minutes)

### Step 4.1: Export New Logo Files

**Create logo files in `/public/images/logos/`:**
- `nyuchi-lingo-purple.svg` (light mode, purple text)
- `nyuchi-lingo-light.svg` (dark mode, light text)
- `bee-logo-mobile.svg` (icon only, 40x40px)
- `bee-favicon.svg` (16px, 32px, 48px sizes)

### Step 4.2: Update Logo Components

```tsx
// app/components/Logo.tsx
import Image from 'next/image'
import { useTheme } from 'next-themes'

export function Logo({ mobile = false }: { mobile?: boolean }) {
  const { theme } = useTheme()
  
  if (mobile) {
    return (
      <Image
        src="/images/logos/bee-logo-mobile.svg"
        alt="Nyuchi Lingo"
        width={40}
        height={40}
        priority
      />
    )
  }
  
  const logoSrc = theme === 'dark' 
    ? '/images/logos/nyuchi-lingo-light.svg'
    : '/images/logos/nyuchi-lingo-purple.svg'
  
  return (
    <Image
      src={logoSrc}
      alt="Nyuchi Lingo"
      width={180}
      height={50}
      priority
    />
  )
}
```

### Step 4.3: Update Favicon

**In `app/layout.tsx` or `_document.tsx`:**
```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/images/logos/bee-favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
}
```

---

## ♿ Phase 5: Accessibility Improvements (1 hour)

### Step 5.1: Update Focus States

**Add purple focus rings to all interactive elements:**

```tsx
// Button focus
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click Me
</Button>

// Input focus
<Input className="focus:border-primary focus:ring-2 focus:ring-primary/30" />

// Link focus
<Link className="focus:outline-none focus:ring-2 focus:ring-primary rounded-sm">
  Learn More
</Link>
```

**Global focus styles in `globals.css`:**
```css
@layer utilities {
  .focus-glow {
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-shadow;
  }
}
```

### Step 5.2: Ensure Touch Target Sizes

**Audit and update all interactive elements:**

```tsx
// Buttons - 48px minimum
<Button className="h-12 px-8">  {/* 48px height */}
  Get Started
</Button>

// Icon buttons
<Button size="icon" className="h-12 w-12">  {/* 48px × 48px */}
  <BookOpen className="h-6 w-6" />
</Button>

// Mobile icon buttons
<Button size="icon" className="h-10 w-10 lg:h-12 lg:w-12">
  <Mic className="h-5 w-5 lg:h-6 lg:w-6" />
</Button>
```

### Step 5.3: Add ARIA Labels

**Update components with proper ARIA:**

```tsx
// Icon-only buttons
<Button aria-label="Play pronunciation" size="icon">
  <PlayCircle className="w-6 h-6" />
</Button>

// Status indicators
<div role="status" aria-live="polite">
  <Badge>7 Day Streak</Badge>
</div>

// Dialogs (fix the warning you mentioned)
<Dialog>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>Delete Phrase</DialogTitle>
      <DialogDescription id="dialog-description">
        Are you sure you want to delete this phrase? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### Step 5.4: Semantic HTML Audit

**Ensure proper structure:**
```tsx
// Page structure
<div className="min-h-screen">
  <header>
    <nav aria-label="Main navigation">
      {/* Navigation items */}
    </nav>
  </header>
  
  <main>
    <section aria-labelledby="hero-heading">
      <h1 id="hero-heading">Master Zimbabwe's Languages</h1>
    </section>
  </main>
  
  <footer>
    {/* Footer content */}
  </footer>
</div>
```

---

## 🧪 Phase 6: Testing & Validation (1 hour)

### Step 6.1: Visual Regression Testing

**Manual checklist:**
- [ ] Typography renders correctly on all pages
- [ ] Noto Serif displays properly for multilingual content
- [ ] Purple color appears consistently
- [ ] Buttons have 10px border-radius
- [ ] Cards have proper left border accent
- [ ] Icons are Lucide throughout
- [ ] Shadows appear soft and layered
- [ ] Hover states work (lift effect)

**Pages to test:**
- Home page
- Browse phrases page
- AI tutor page
- Profile/settings
- Admin pages (if applicable)
- Mobile views (< 640px)
- Tablet views (640-1023px)
- Desktop views (≥ 1024px)

### Step 6.2: Accessibility Audit

**Run automated tests:**
```bash
# Lighthouse CI
npm run lighthouse

# axe DevTools
# Install browser extension and run on key pages
```

**Manual keyboard testing:**
- [ ] Tab through all interactive elements
- [ ] Focus indicators clearly visible (purple ring)
- [ ] No keyboard traps
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons

**Screen reader testing:**
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] ARIA labels on icon buttons
- [ ] Dialog descriptions present

### Step 6.3: Contrast Verification

**Use WebAIM Contrast Checker on:**
```
✅ Purple (#5f5873) on white
✅ White text on purple buttons
✅ Army green on white
✅ Body text on backgrounds
✅ Link colors on backgrounds
✅ Disabled states (must be distinguishable)
```

**Minimum requirements:**
- Body text: 4.5:1 ratio
- Large text (18px+): 3:1 ratio
- UI components: 3:1 ratio

### Step 6.4: Performance Check

**Verify font loading:**
```bash
# Check network tab in DevTools
# Fonts should:
✅ Load with font-display: swap
✅ Not cause layout shift
✅ Preload critical fonts
```

**Check bundle size:**
```bash
npm run build
# Review .next/analyze output
# Font files should be optimized
```

---

## 📦 Phase 7: Documentation Update (30 minutes)

### Step 7.1: Update Component Documentation

**Document new patterns:**
```markdown
## Phrase Card Component

### Usage
Displays a language phrase with pronunciation, translation, and context.

### Design Specifications
- Font: Noto Serif for phrase text (multilingual support)
- Border: 4px left border in primary purple
- Border Radius: 12px (lg)
- Shadow: level-2 elevation
- Hover: Lifts 4px with enhanced shadow
- Touch Target: Minimum 48px for all buttons

### Example
[Component code example]
```

### Step 7.2: Update README

**Add migration notes:**
```markdown
## Recent Updates (v3.0)

### Typography
- Migrated to Noto Serif for all headings (800+ languages supported)
- Improved multilingual rendering for Shona, Ndebele, Chinese, English
- Inter for body text and UI elements

### Brand Alignment
- Aligned with Nyuchi Africa ecosystem
- Primary color: Warm purple (#5f5873)
- Claude-inspired design patterns (rounded corners, soft shadows)

### Accessibility
- WCAG 2.1 AA compliant
- Improved focus indicators (purple glow)
- Better keyboard navigation
```

### Step 7.3: Update Style Guide

**Create/update `STYLE_GUIDE.md`:**
- Link to full brand guidelines
- Quick reference for developers
- Component examples
- Color usage guidelines
- Typography specimens

---

## 🚀 Deployment Checklist

Before deploying to production:

### Pre-Deployment
- [ ] All tests passing
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Visual regression tests passed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing complete (iOS, Android)
- [ ] Font files optimized and cached
- [ ] Logo files exported and uploaded

### Deployment
- [ ] Update version number to 3.0
- [ ] Tag release in Git: `v3.0.0-brand-alignment`
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Check Core Web Vitals

### Post-Deployment
- [ ] Announce brand update to users
- [ ] Update marketing materials
- [ ] Update screenshots/documentation
- [ ] Collect user feedback
- [ ] Monitor accessibility reports

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: Fonts not loading
**Solution**: 
```typescript
// Ensure font variables are applied to html element
<html className={`${inter.variable} ${notoSerif.variable}`}>
```

**Issue**: Color contrast failures
**Solution**:
```tsx
// Use darker variants for text on light backgrounds
className="text-primary-700" // Instead of text-primary
```

**Issue**: Multilingual characters not rendering
**Solution**:
```typescript
// Add required subsets to Noto Serif
const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  // Note: Chinese requires separate font loading
})
```

**Issue**: Focus rings not visible
**Solution**:
```css
/* Add to globals.css */
*:focus-visible {
  @apply ring-2 ring-primary ring-offset-2 outline-none;
}
```

**Issue**: Icons not displaying correctly
**Solution**:
```tsx
// Ensure Lucide React is installed
npm install lucide-react

// Import correctly
import { BookOpen } from 'lucide-react'

// Use with proper sizing
<BookOpen className="w-6 h-6" strokeWidth={1.5} />
```

---

## 📞 Support & Resources

### Documentation
- **Full Brand Guidelines**: `/NYUCHI_LINGO_BRAND_GUIDELINES_v3.md`
- **Quick Reference**: `/NYUCHI_LINGO_QUICK_REFERENCE.md`
- **Tailwind Config**: `/tailwind.config.nyuchi-lingo.js`

### Design Resources
- Figma: [Link to design files]
- Logo Assets: `/public/images/logos/`
- Component Library: Storybook (if implemented)

### Testing Tools
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **WAVE**: https://wave.webaim.org/
- **Lighthouse**: Chrome DevTools
- **axe DevTools**: Browser extension

### Support
- **Brand Questions**: brand@nyuchi.com
- **Technical Issues**: dev@nyuchi.com
- **Accessibility**: accessibility@nyuchi.com

---

## ✅ Final Checklist

After completing all phases, verify:

### Visual
- [ ] Noto Serif on all headings
- [ ] Inter on all body text
- [ ] Purple primary color throughout
- [ ] Army green for success states
- [ ] Sunset gold for achievements
- [ ] 10px button border radius
- [ ] 12px card border radius
- [ ] Lucide icons exclusively
- [ ] Soft, layered shadows
- [ ] Purple left border on phrase cards

### Functionality
- [ ] All buttons work correctly
- [ ] Hover states trigger properly
- [ ] Focus states visible
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] Mobile navigation works
- [ ] Sidebar collapse/expand works

### Performance
- [ ] Fonts load efficiently
- [ ] No layout shift
- [ ] Images optimized
- [ ] Core Web Vitals green

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 48px
- [ ] Focus indicators present
- [ ] ARIA labels added
- [ ] Semantic HTML used

### Documentation
- [ ] README updated
- [ ] Style guide updated
- [ ] Component docs updated
- [ ] Migration notes added
- [ ] Version number incremented

---

## 🎉 Success Metrics

Track these metrics post-migration:
- **User Engagement**: Any changes in session duration?
- **Accessibility**: Reduction in accessibility complaints?
- **Performance**: Core Web Vitals scores?
- **Multilingual Users**: Increased engagement from non-English users?
- **Brand Perception**: User feedback on new design?

---

*Migration Guide v3.0*  
*Built with ❤️ by Nyuchi Africa*  
*"I am because we are" - Ubuntu*
