# Nyuchi Lingo - Design System & Component Standards

**Last Updated**: November 10, 2025
**Version**: 2.0 (Mobile-First Touch Optimization)

---

## 📱 Mobile-First Philosophy

All components are designed with **mobile-first** principles:
- **Touch targets**: Minimum 44px × 44px (11rem = 44px)
- **Larger on mobile**: Components are bigger on mobile, smaller on desktop
- **Responsive scaling**: Uses Tailwind's responsive prefixes (md:)
- **Text sizing**: Base text (16px) on mobile, sm text (14px) on desktop

### Why Mobile-First?

1. **Accessibility**: Easier to tap with fingers
2. **Usability**: Better for users with larger fingers or motor difficulties
3. **WCAG 2.1 AA Compliance**: Meets 44×44px target size requirement
4. **Progressive Enhancement**: Start with mobile, enhance for desktop

---

## 🎨 Component Standards

### Buttons

All buttons follow **mobile-first sizing** with responsive scaling.

#### Button Sizes

| Size | Mobile Height | Desktop Height | Mobile Padding | Desktop Padding | Use Case |
|------|--------------|----------------|----------------|-----------------|----------|
| `sm` | 40px (10rem) | 36px (9rem) | px-4 (16px) | px-3 (12px) | Secondary actions, table rows |
| `default` | **44px (11rem)** | 40px (10rem) | px-5 (20px) | px-4 (16px) | **Primary actions** |
| `lg` | 48px (12rem) | 44px (11rem) | px-7 (28px) | px-6 (24px) | Hero CTAs, prominent actions |
| `icon` | 44px × 44px | 40px × 40px | - | - | Icon-only buttons |
| `icon-sm` | 40px × 40px | 36px × 36px | - | - | Small icon buttons |
| `icon-lg` | 48px × 48px | 44px × 44px | - | - | Large icon buttons |

#### Button Variants

```tsx
// Primary (default) - Main actions
<Button variant="default">Save Changes</Button>

// Destructive - Delete, remove actions
<Button variant="destructive">Delete Item</Button>

// Outline - Secondary actions
<Button variant="outline">Cancel</Button>

// Secondary - Alternative style
<Button variant="secondary">Learn More</Button>

// Ghost - Subtle actions, navigation
<Button variant="ghost">Skip</Button>

// Link - Text-only, styled like a link
<Button variant="link">View Details</Button>
```

#### Button States

```tsx
// Hover
hover:bg-primary/90

// Active (pressed)
active:bg-primary/80

// Focus (keyboard)
focus-visible:ring-[3px] focus-visible:ring-ring/50

// Disabled
disabled:opacity-50 disabled:pointer-events-none
```

#### Button Usage Examples

```tsx
// ✅ Good - Default size for main actions
<Button>Submit Form</Button>

// ✅ Good - Large for hero CTAs
<Button size="lg">Get Started Free</Button>

// ✅ Good - Small for table actions
<Button size="sm" variant="ghost">Edit</Button>

// ✅ Good - Icon button with aria-label
<Button size="icon" aria-label="Close menu">
  <X className="h-4 w-4" />
</Button>

// ❌ Bad - Too small for mobile
<Button className="h-6">Click me</Button>

// ❌ Bad - Missing aria-label on icon button
<Button size="icon"><X /></Button>
```

---

### Input Fields

All text inputs have **larger touch targets** on mobile.

#### Input Sizes

| Property | Mobile | Desktop | Notes |
|----------|--------|---------|-------|
| Height | 44px (11rem) | 40px (10rem) | Meets WCAG minimum |
| Padding X | 16px (px-4) | 12px (px-3) | Comfortable spacing |
| Padding Y | 10px (py-2.5) | 8px (py-2) | Vertical alignment |
| Font Size | 16px (text-base) | 14px (text-sm) | Prevents iOS zoom |
| Border | 1px solid | 1px solid | Consistent |
| Border Radius | 6px (rounded-md) | 6px (rounded-md) | Modern look |

#### Input States

```tsx
// Default
border-input bg-transparent

// Focus
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]

// Error
aria-invalid:border-destructive aria-invalid:ring-destructive/20

// Disabled
disabled:opacity-50 disabled:cursor-not-allowed
```

#### Input Usage Examples

```tsx
// ✅ Good - With label and proper spacing
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// ✅ Good - Error state with aria-invalid
<Input aria-invalid={hasError} aria-describedby="error-message" />
{hasError && <p id="error-message" className="text-sm text-destructive">{errorMessage}</p>}

// ✅ Good - Disabled state
<Input disabled value="Cannot edit" />

// ❌ Bad - No label (accessibility issue)
<Input placeholder="Enter email" />

// ❌ Bad - Custom height breaks standards
<Input className="h-8" />
```

---

### Text Areas

Multi-line text inputs with **comfortable height** for mobile typing.

#### Textarea Sizes

| Property | Mobile | Desktop |
|----------|--------|---------|
| Min Height | 96px (min-h-24) | 80px (min-h-20) |
| Padding X | 16px (px-4) | 12px (px-3) |
| Padding Y | 12px (py-3) | 8px (py-2) |
| Font Size | 16px (text-base) | 14px (text-sm) |

```tsx
// ✅ Good - Standard textarea
<Textarea placeholder="Enter your message..." />

// ✅ Good - With label
<Label htmlFor="message">Message</Label>
<Textarea id="message" rows={4} />

// ✅ Good - Controlled with character count
<Textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} />
<p className="text-sm text-muted-foreground">{text.length}/500</p>
```

---

### Select Dropdowns

#### Select Sizes

| Size | Mobile Height | Desktop Height |
|------|--------------|----------------|
| `default` | 44px (h-11) | 40px (h-10) |
| `sm` | 40px (h-10) | 36px (h-9) |

```tsx
// ✅ Good - Standard select
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// ✅ Good - Small select
<Select>
  <SelectTrigger size="sm">
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    {/* options */}
  </SelectContent>
</Select>
```

---

### Labels

Labels are **larger on mobile** for better readability.

#### Label Sizes

| Property | Mobile | Desktop |
|----------|--------|---------|
| Font Size | 16px (text-base) | 14px (text-sm) |
| Font Weight | medium (500) | medium (500) |
| Margin Bottom | 8px (mb-2) | 8px (mb-2) |

```tsx
// ✅ Good - Proper label usage
<Label htmlFor="username">Username</Label>
<Input id="username" />

// ✅ Good - With icon
<Label>
  <Mail className="h-4 w-4" />
  Email Address
</Label>

// ❌ Bad - No htmlFor connection
<Label>Username</Label>
<Input />
```

---

## 📏 Spacing Standards

### Consistent Spacing Scale

Use Tailwind's spacing scale consistently:

| Size | Value | Use Case |
|------|-------|----------|
| `1` | 4px | Tight spacing (badges, pills) |
| `2` | 8px | Component internal spacing |
| `3` | 12px | Small gaps between elements |
| `4` | 16px | **Default spacing** between components |
| `6` | 24px | Section spacing |
| `8` | 32px | Large section breaks |
| `12` | 48px | Page section spacing |
| `16` | 64px | Major page divisions |

### Common Patterns

```tsx
// ✅ Good - Form field spacing
<div className="space-y-4">
  <div>
    <Label>Field 1</Label>
    <Input />
  </div>
  <div>
    <Label>Field 2</Label>
    <Input />
  </div>
</div>

// ✅ Good - Button group spacing
<div className="flex gap-3">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>

// ✅ Good - Section spacing
<section className="py-8 md:py-12">
  {/* content */}
</section>
```

---

## 🎯 Touch Target Guidelines

### WCAG 2.1 Level AA Requirements

**Minimum touch target size**: 44 × 44 pixels

All interactive elements (buttons, links, inputs) meet or exceed this requirement on mobile.

### Touch Target Checklist

- [x] Buttons: 44px minimum height on mobile
- [x] Icon buttons: 44 × 44px on mobile
- [x] Input fields: 44px height on mobile
- [x] Select dropdowns: 44px height on mobile
- [x] Links in navigation: 44px height
- [x] Checkboxes/Radio: Adequate click area
- [x] Toggle switches: Adequate touch area

### Implementation

```tsx
// ✅ Good - Meets minimum (44px)
<Button>Click me</Button>

// ✅ Good - Icon button with adequate size
<Button size="icon" aria-label="Menu">
  <Menu className="h-5 w-5" />
</Button>

// ✅ Good - Link with padding for touch area
<Link href="/" className="py-3 px-4">Home</Link>

// ❌ Bad - Too small (32px)
<button className="h-8 w-8">X</button>

// ❌ Bad - Text link without padding
<Link href="/">Tiny link</Link>
```

---

## 🌈 Color Usage

### Interactive States

All interactive elements have clear visual feedback:

```css
/* Hover - 10% lighter/darker */
hover:bg-primary/90

/* Active - 20% lighter/darker */
active:bg-primary/80

/* Focus - Ring indicator */
focus-visible:ring-[3px] focus-visible:ring-ring/50

/* Disabled - 50% opacity */
disabled:opacity-50
```

### Color Contrast

**WCAG AA Requirements**:
- Normal text (< 18px): **4.5:1** contrast ratio
- Large text (≥ 18px): **3:1** contrast ratio
- UI components: **3:1** contrast ratio

Nyuchi Lingo's primary purple meets WCAG AA standards for all use cases.

---

## 📱 Mobile-Specific Patterns

### Avoid iOS Auto-Zoom

**Problem**: iOS Safari zooms in when input font size is < 16px

**Solution**: Use `text-base` (16px) on mobile inputs

```tsx
// ✅ Good - Won't trigger zoom
<Input className="text-base md:text-sm" />

// ❌ Bad - Triggers iOS zoom
<Input className="text-sm" />
```

### Touch-Friendly Spacing

**Minimum spacing between tap targets**: 8px

```tsx
// ✅ Good - Adequate spacing
<div className="flex gap-3">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// ❌ Bad - Too close, easy to mis-tap
<div className="flex gap-1">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

---

## 🎨 Component Combinations

### Form Patterns

```tsx
// Standard form field
<div className="space-y-2">
  <Label htmlFor="field">Label</Label>
  <Input id="field" />
  <p className="text-sm text-muted-foreground">Helper text</p>
</div>

// Form field with error
<div className="space-y-2">
  <Label htmlFor="field">Label</Label>
  <Input id="field" aria-invalid aria-describedby="error" />
  <p id="error" className="text-sm text-destructive">Error message</p>
</div>

// Form with actions
<form className="space-y-6">
  {/* fields */}
  <div className="flex gap-3 justify-end">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

### Card Patterns

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Interactive card (clickable)
<Card className="cursor-pointer hover:bg-accent/50 transition-colors">
  <CardContent className="p-6">
    {/* content */}
  </CardContent>
</Card>
```

---

## ♿ Accessibility Checklist

### Interactive Elements

- [x] All buttons have visible text or aria-label
- [x] All form inputs have associated labels
- [x] All icons have aria-label or aria-hidden
- [x] Touch targets ≥ 44px on mobile
- [x] Color contrast meets WCAG AA
- [x] Keyboard navigation works
- [x] Focus indicators visible
- [x] Error messages use aria-describedby

### Testing

```bash
# Test with keyboard only
Tab, Shift+Tab, Enter, Space, Arrow keys

# Test with screen reader
VoiceOver (Mac), NVDA (Windows), TalkBack (Android)

# Test with touch
Large fingers, single-handed use, different grip styles

# Test contrast
WCAG Color Contrast Checker
```

---

## 📐 Responsive Breakpoints

### Tailwind Breakpoints (Used Throughout)

| Prefix | Min Width | Use Case |
|--------|-----------|----------|
| (none) | 0px | **Mobile-first** - Default styles |
| `sm:` | 640px | Small tablets (portrait) |
| `md:` | 768px | **Desktop** - Where we reduce sizes |
| `lg:` | 1024px | Large desktops |
| `xl:` | 1280px | Extra large screens |
| `2xl:` | 1536px | Ultra-wide displays |

### Our Pattern

```tsx
// Mobile-first: Larger → Smaller
className="h-11 md:h-10"  // 44px mobile, 40px desktop
className="text-base md:text-sm"  // 16px mobile, 14px desktop
className="px-5 md:px-4"  // 20px mobile, 16px desktop
```

---

## 🎯 Best Practices

### DO's

✅ Use semantic HTML (button, input, label, etc.)
✅ Follow mobile-first approach
✅ Test on real devices
✅ Use standardized components
✅ Add aria-labels to icon buttons
✅ Connect labels to inputs with htmlFor
✅ Provide visual feedback on interactions
✅ Use consistent spacing (4, 8, 16, 24px)
✅ Test with keyboard and screen reader

### DON'Ts

❌ Override component heights arbitrarily
❌ Make touch targets < 44px on mobile
❌ Use text < 16px on mobile inputs
❌ Forget aria-labels on icon-only buttons
❌ Mix spacing scales inconsistently
❌ Rely on color alone for meaning
❌ Disable focus indicators
❌ Ignore error states

---

## 🚀 Quick Reference

### Standard Form

```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter your name" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="message">Message</Label>
    <Textarea id="message" />
  </div>

  <div className="flex gap-3 justify-end">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Submit</Button>
  </div>
</form>
```

### Standard Button Group

```tsx
<div className="flex flex-wrap gap-3">
  <Button size="lg">Primary Action</Button>
  <Button variant="outline">Secondary</Button>
  <Button variant="ghost">Tertiary</Button>
</div>
```

### Standard Select

```tsx
<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select>
    <SelectTrigger id="category">
      <SelectValue placeholder="Choose a category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Option 1</SelectItem>
      <SelectItem value="2">Option 2</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 📚 Component Library

All components are in `/components/ui/`:

- `button.tsx` - All button variants and sizes
- `input.tsx` - Text input fields
- `textarea.tsx` - Multi-line text inputs
- `label.tsx` - Form labels
- `select.tsx` - Dropdown selections
- `card.tsx` - Content containers
- `dialog.tsx` - Modal dialogs
- `badge.tsx` - Status indicators
- `checkbox.tsx` - Checkboxes
- `radio-group.tsx` - Radio buttons
- `switch.tsx` - Toggle switches
- `slider.tsx` - Range sliders
- `tabs.tsx` - Tab navigation
- `accordion.tsx` - Collapsible content
- `toast.tsx` - Notifications

---

## 🔍 Implementation Status

### ✅ Completed (November 10, 2025)

All core UI components and feature components have been updated to meet mobile-first standards:

**Core Components**:
- ✅ Button - All size variants mobile-first responsive
- ✅ Input - 44px mobile height, prevents iOS zoom
- ✅ Label - Larger text on mobile
- ✅ Select - 44px mobile trigger height
- ✅ Textarea - Increased min-height on mobile

**Feature Components**:
- ✅ Theme Switcher - Uses standard icon sizes
- ✅ Phrase Comparison - Status and audio buttons standardized
- ✅ Search Bar - Clear button uses icon-sm
- ✅ App Sidebar - Collapse button standardized

**Documentation**:
- ✅ Design System created
- ✅ Mobile Usability Fixes documented
- ✅ All changes tested and verified

See [MOBILE_USABILITY_FIXES.md](MOBILE_USABILITY_FIXES.md) for complete details.

---

**Last Updated**: November 10, 2025
**Maintained by**: Nyuchi Lingo Development Team
**Framework**: Next.js 16 + Tailwind CSS + Radix UI
**Accessibility**: WCAG 2.1 Level AA Compliant ✅
