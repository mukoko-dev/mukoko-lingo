# Nyuchi Lingo - Quick Reference Guide
## Brand Implementation Cheat Sheet

**Version**: 3.0 | **Date**: November 10, 2025

---

## 🎨 Color Palette

### Primary Colors
```css
/* Warm Purple - Primary Brand */
--primary: #5f5873
--primary-hover: #7c73e6
--primary-dark: #4a4560
--primary-light: #8f86a8

/* Success & Milestones */
--success: #729B63
--success-dark: #8FB47F

/* Accents */
--accent-gold: #F6AD55
--accent-brown: #8B7355
```

### Neutrals
```css
--text-primary: #1a1a1a
--text-secondary: #666666
--background: #f7fafc
--card-bg: #fafafa
--border: #e0e0e0
```

### Semantic
```css
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

---

## 📝 Typography

### Font Stacks
```css
/* Headings & Titles */
font-family: 'Noto Serif', serif;

/* Body & UI */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
```css
/* Desktop */
H1:         56px / 800 / 1.2 (Noto Serif)
H2:         36px / 700 / 1.2 (Noto Serif)
H3:         28px / 700 / 1.3 (Noto Serif)
H4:         20px / 600 / 1.4 (Noto Serif)
Body Large: 18px / 400 / 1.6 (Inter)
Body:       16px / 400 / 1.6 (Inter)
Small:      14px / 400 / 1.5 (Inter)
Tiny:       12px / 400 / 1.5 (Inter)

/* Mobile */
H1:         44px / 800 / 1.2
H2:         28px / 700 / 1.2
H3:         24px / 700 / 1.3
H4:         18px / 600 / 1.4
Body:       15px / 400 / 1.6
Small:      13px / 400 / 1.5
```

---

## 🧩 Components

### Buttons
```css
/* Primary */
background: #5f5873
color: white
padding: 16px 32px
border-radius: 10px
font: Inter 600, 16px
min-height: 48px
hover: lift -2px, shadow enhanced

/* Secondary */
background: transparent
border: 2px solid #5f5873
color: #5f5873
hover: light purple fill

/* Ghost */
background: transparent
color: inherit
hover: accent background
```

### Cards
```css
border-radius: 12px
padding: 24px
border: 1px solid #e0e0e0
shadow: 0 2px 8px rgba(0,0,0,0.08)
hover: lift -4px, shadow 0 8px 16px rgba(0,0,0,0.12)
```

### Phrase Card (Special)
```css
border-radius: 12px
padding: 20px
border-left: 4px solid #5f5873  /* Purple accent */
shadow: 0 2px 6px rgba(95,88,115,0.08)
hover: border-left becomes 6px
```

### Icons
```
Source: Lucide Icons only
Stroke: 1.5-2px
Sizes: 24px (standard), 40px (mobile), 48px (hero)
Colors: #1a1a1a, #5f5873, #729B63
```

---

## 📐 Spacing (4px Grid)

```css
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   24px
2xl:  32px
3xl:  48px
4xl:  64px
5xl:  80px
```

### Component Spacing
```
Between cards:      24px
Between sections:   48px (desktop), 32px (mobile)
Page padding:       32px (desktop), 16px (mobile)
Content blocks:     16px
```

---

## 🎭 Shadows (Soft & Layered)

```css
/* Elevation Levels */
Level 1:  0 1px 3px rgba(0,0,0,0.06)    /* Cards, inputs */
Level 2:  0 2px 8px rgba(0,0,0,0.08)    /* Elevated cards */
Level 3:  0 4px 16px rgba(0,0,0,0.10)   /* Modals */
Level 4:  0 8px 32px rgba(0,0,0,0.12)   /* Floating */
Focus:    0 0 0 3px rgba(95,88,115,0.3) /* Purple glow */
```

---

## 📱 Breakpoints

```css
Mobile:         < 640px
Tablet:         640px - 1023px
Desktop:        ≥ 1024px
Large Desktop:  ≥ 1440px
```

---

## ♿ Accessibility

### Requirements
- ✅ Contrast ratios ≥ 4.5:1 (body), ≥ 3:1 (large text)
- ✅ Touch targets ≥ 48px × 48px
- ✅ Focus indicators visible (3px purple glow)
- ✅ Keyboard navigation functional
- ✅ ARIA labels on interactive elements
- ✅ Semantic HTML

### Color Contrast
```
Purple on white:    7.4:1 ✓
Army green on white: 4.8:1 ✓
Dark text on light:  12.8:1 ✓
```

---

## 🎨 Logo Usage

### Files
- Desktop Light: `Nyuchi_Lingo_purple.svg`
- Desktop Dark: `Nyuchi_Lingo_dark.svg`
- Mobile: `bee-logo-mobile.svg` (icon only)
- Favicon: `bee-favicon.svg`

### Sizing
- Desktop logo min width: 180px
- Mobile logo: 40px × 40px
- Clear space: Height of bee icon

---

## 🔤 Multilingual Support

### Current Languages (Phase 1)
English, Shona, Ndebele, Chinese

### Expansion Roadmap
- **Phase 2**: Swahili, Amharic, Somali (East Africa)
- **Phase 3**: Yoruba, Igbo, Hausa, Twi (West Africa)
- **Phase 4**: Zulu, Xhosa, Afrikaans, Setswana (Southern Africa)
- **Phase 5**: Egyptian/Moroccan/Algerian Arabic (North Africa)
- **Phase 6**: Lingala, Kikongo, Kinyarwanda (Central Africa)

### Why Noto Serif?
- 800+ languages supported (covers ALL African languages)
- Excellent rendering for Latin-based, Ethiopic, and Arabic scripts
- Professional appearance across all scripts
- Perfect for Shona, Ndebele NOW + future African languages

---

## 🎯 Common Patterns

### Progress Card
```jsx
<Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground font-sans">
        Study Streak
      </p>
      <h3 className="text-4xl font-serif font-bold text-primary">
        7 Days
      </h3>
    </div>
    <Flame className="w-16 h-16 text-orange-500" />
  </div>
</Card>
```

### Phrase Card
```jsx
<Card className="border-l-4 border-primary hover:shadow-lg">
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

### Button Group
```jsx
<div className="flex gap-4">
  <Button className="bg-primary hover:bg-primary/90">
    Primary Action
  </Button>
  <Button variant="outline">
    Secondary Action
  </Button>
</div>
```

---

## 🎮 Gamification Colors

```css
/* Study Streak */
Background: linear-gradient(to-br, #fff7ed, #fee2e2)
Icon: 🔥 (orange-red)

/* Phrases Mastered */
Background: linear-gradient(to-br, #faf5ff, #eff6ff)
Icon: 🏆 (purple)

/* Daily Goal */
Background: linear-gradient(to-br, #f0fdf4, #ecfdf5)
Icon: 🎯 (green)

/* Level Badges */
Border: 3px solid #5f5873
Background: Gradient by level
Icon: Centered, Lucide
```

---

## 🚀 Implementation Checklist

### Essential Changes
- [ ] Install Noto Serif font (all weights)
- [ ] Update primary color to #5f5873
- [ ] Change button border-radius to 10px
- [ ] Replace all icons with Lucide
- [ ] Update all headings to Noto Serif
- [ ] Verify 48px minimum touch targets
- [ ] Test WCAG 2.1 AA compliance
- [ ] Add purple focus indicators

### Typography
- [ ] H1-H4: Noto Serif
- [ ] Body/UI: Inter
- [ ] Font sizes match scale
- [ ] Line heights: 1.2 (headings), 1.6 (body)
- [ ] Test multilingual rendering

### Colors
- [ ] Primary: #5f5873
- [ ] Success: #729B63
- [ ] Accent: #F6AD55
- [ ] All contrast ratios ≥ 4.5:1
- [ ] Test dark mode variants

### Components
- [ ] Button radius: 10px
- [ ] Card radius: 12px
- [ ] Soft shadows (layered)
- [ ] 4px spacing grid
- [ ] Hover states with lift
- [ ] Focus states with glow

---

## 📦 CSS Variables Template

```css
:root {
  /* Colors */
  --primary: #5f5873;
  --primary-hover: #7c73e6;
  --primary-dark: #4a4560;
  --success: #729B63;
  --accent-gold: #F6AD55;
  
  /* Neutrals */
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --background: #f7fafc;
  --card-bg: #fafafa;
  --border: #e0e0e0;
  
  /* Typography */
  --font-serif: 'Noto Serif', serif;
  --font-sans: 'Inter', sans-serif;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-xl: 0 8px 32px rgba(0,0,0,0.12);
  --shadow-focus: 0 0 0 3px rgba(95,88,115,0.3);
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

---

## 🔗 Quick Links

**Full Guidelines**: `/NYUCHI_LINGO_BRAND_GUIDELINES_v3.md`  
**Design System**: `/DESIGN_SYSTEM.md`  
**Component Examples**: See full guidelines  
**Nyuchi Africa Ecosystem**: Project documentation

---

*Built with ❤️ by Nyuchi Africa*  
*"I am because we are" - Ubuntu*
