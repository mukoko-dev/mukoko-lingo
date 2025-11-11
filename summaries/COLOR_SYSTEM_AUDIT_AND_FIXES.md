# Color System Audit and Fixes

**Date**: November 11, 2025
**Status**: In Progress
**Priority**: High - Visual Consistency

## Problem Statement

Components throughout the app are using hardcoded Tailwind colors (e.g., `bg-green-500`, `bg-blue-500`) instead of the design system tokens defined in `tailwind.config.js` and `globals.css`. This causes:

1. **Inconsistent branding** - Colors don't match Nyuchi brand palette
2. **Poor contrast** - Buttons/badges blend with backgrounds in light/dark modes
3. **Maintenance issues** - Can't update colors globally
4. **Accessibility concerns** - Some color combinations fail WCAG contrast standards

## Audit Results

### Files with Hardcoded Colors (25+ instances):

#### Admin Components:
- `components/admin/guardrails-client.tsx` - `bg-green-500` badges
- `components/admin/user-management.tsx` - `bg-green-500` status indicators
- `components/admin/admin-dashboard-overview.tsx` - `bg-green-500` badges

#### App Components:
- `components/analytics-client.tsx` - `bg-blue-500`, `bg-green-500` chart colors
- `components/progress-client.tsx` - `bg-blue-500`, `bg-green-500` progress bars
- `components/profile-client.tsx` - `bg-green-500`, `bg-red-500` status badges
- `components/phrase-comparison.tsx` - `border-blue-500`, `border-green-500`, `border-red-500`
- `components/dashboard-client.tsx` - `bg-green-500`, `bg-blue-500` icon backgrounds
- `components/dev-mode-banner.tsx` - `bg-yellow-500` warning banner

#### Public Pages:
- `app/why/page.tsx` - `bg-blue-500`, `bg-green-500`, `bg-red-500`
- `app/about/page.tsx` - `bg-green-500`
- `app/ai-policy/page.tsx` - `bg-green-500`

## Design System Tokens (Correct Usage)

### Primary Colors (Warm Purple - Nyuchi Africa):
```tsx
// Light mode
bg-primary-700  // #5f5873 - Main brand
bg-primary-600  // #7c73e6 - Hover state
bg-primary-800  // #4a4560 - Active state

// Dark mode
bg-primary-600  // #7c73e6 - Ubuntu Blue
bg-primary-500  // #9186ae - Hover
bg-primary-700  // #5f5873 - Active
```

### Secondary Colors (Army Green - Success):
```tsx
// Light mode
bg-secondary-500  // #729B63 - Main
bg-secondary-400  // #8FB47F - Hover
bg-secondary-600  // #5d804f - Active

// Dark mode
bg-secondary-400  // #8FB47F - Main
bg-secondary-300  // #a8d597 - Hover
bg-secondary-500  // #729B63 - Active
```

### Accent Colors (Sunset Gold):
```tsx
bg-accent-500  // #F6AD55 - Main
bg-accent-400  // #f99d4e - Hover
bg-accent-600  // #f47420 - Active
```

### Status Colors (Semantic):
```tsx
// Success (use secondary green)
bg-secondary-500 text-white

// Warning
bg-warning-DEFAULT  // #f59e0b

// Error
bg-error-DEFAULT  // #ef4444

// Info (use chart colors)
bg-chart-4  // #3b82f6 - Blue
```

### Secondary Palette (Category Colors):
```tsx
// Terracotta (Culture)
bg-terracotta-500  // #ef7647

// Coral (Speaking)
bg-coral-500  // #ff6b6b

// Sage (Grammar)
bg-sage-500  // #6ba76b

// Sky (Listening)
bg-sky-500  // #0ea5e9

// Lavender (Reading)
bg-lavender-500  // #a855f7

// Teal (Vocabulary)
bg-teal-500  // #14b8a6
```

## Fixes Applied

### 1. Button Component (`components/ui/button.tsx`)
✅ **Fixed** - Now uses explicit color scale:
- Default: `bg-primary-700` (light) / `bg-primary-600` (dark)
- Secondary: `bg-secondary-500` (light) / `bg-secondary-400` (dark)
- Outline: `bg-card` with proper borders
- Ghost: `hover:bg-muted`

### 2. Badge Component (`components/ui/badge.tsx`)
✅ **Fixed** - Now uses explicit color scale:
- Default: `bg-primary-700` (light) / `bg-primary-600` (dark)
- Secondary: `bg-secondary-500` (light) / `bg-secondary-400` (dark)
- Outline: `border-border bg-transparent`

### 3. Remaining Files (Need Fixes)

#### High Priority (Admin):
- [ ] `components/admin/guardrails-client.tsx:301,473`
  - Replace `bg-green-500` → `bg-secondary-500`

- [ ] `components/admin/user-management.tsx:597`
  - Replace `bg-green-500` → `bg-secondary-500`

- [ ] `components/admin/admin-dashboard-overview.tsx:250`
  - Replace `bg-green-500` → `bg-secondary-500`

#### Medium Priority (App):
- [ ] `components/analytics-client.tsx:103,113,120,128`
  - Replace `bg-blue-500` → `bg-chart-4` (Blue from chart colors)
  - Replace `bg-green-500` → `bg-secondary-500`

- [ ] `components/progress-client.tsx:102,128`
  - Replace `bg-blue-500` → `bg-chart-4`
  - Replace `bg-green-500` → `bg-secondary-500`

- [ ] `components/profile-client.tsx:340-341`
  - Replace `bg-green-500` → `bg-secondary-500`
  - Replace `bg-red-500` → `bg-error-DEFAULT`

- [ ] `components/phrase-comparison.tsx:94-97,144`
  - Replace `border-blue-500` → `border-chart-4`
  - Replace `border-green-500` → `border-secondary-500`
  - Replace `border-red-500` → `border-error-DEFAULT`
  - Replace `bg-green-500` → `bg-secondary-500`

- [ ] `components/dashboard-client.tsx:212,228`
  - Replace `bg-green-500/20` → `bg-secondary-500/20`
  - Replace `bg-blue-500/20` → `bg-chart-4/20`

- [ ] `components/dev-mode-banner.tsx:44`
  - Replace `bg-yellow-500` → `bg-warning-DEFAULT`

#### Low Priority (Marketing Pages):
- [ ] `app/why/page.tsx:64,77,103`
- [ ] `app/about/page.tsx:43`
- [ ] `app/ai-policy/page.tsx:58`

## Implementation Strategy

### Phase 1: Core UI Components ✅
- [x] Button component
- [x] Badge component
- [ ] Input component
- [ ] Select component
- [ ] Dialog component

### Phase 2: Admin Pages (Next)
Replace hardcoded colors in:
1. Guardrails management
2. User management
3. Dashboard overview

### Phase 3: App Pages
Update:
1. Analytics charts
2. Progress tracking
3. Profile status
4. Dashboard icons

### Phase 4: Marketing Pages
Update landing pages to use design tokens

## Testing Checklist

- [ ] Test button visibility in light mode
- [ ] Test button visibility in dark mode
- [ ] Test badge contrast in light mode
- [ ] Test badge contrast in dark mode
- [ ] Verify all status indicators are visible
- [ ] Check accessibility with screen readers
- [ ] Validate WCAG AA contrast ratios

## Related Files

- `tailwind.config.js` - Color token definitions
- `app/globals.css` - CSS variable mappings
- `components/ui/button.tsx` - Button variants
- `components/ui/badge.tsx` - Badge variants
- `BRANDING.md` - Brand color guidelines

## Notes

- All hardcoded colors should be replaced with semantic tokens
- Use `bg-secondary-500` for success/green states
- Use `bg-chart-4` for info/blue states
- Use `bg-error-DEFAULT` for error/red states
- Use `bg-warning-DEFAULT` for warning/yellow states
- Always provide dark mode alternatives
