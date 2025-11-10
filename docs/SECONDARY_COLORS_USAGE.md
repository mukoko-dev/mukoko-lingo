# Secondary Colors - Usage Guide

**Version**: 1.0
**Date**: November 11, 2025
**Source**: [NYUCHI_LINGO_SECONDARY_COLORS.md](../brand/NYUCHI_LINGO_SECONDARY_COLORS.md)

## Quick Start

### Import the CategoryBadge Component

```tsx
import { CategoryBadge, GrammarBadge, VocabularyBadge } from '@/components/ui/category-badge'
```

### Basic Usage

```tsx
// Generic category badge
<CategoryBadge category="grammar">Grammar</CategoryBadge>

// With icon
<CategoryBadge category="speaking" icon="🎤">Speaking</CategoryBadge>

// Convenience components with built-in icons
<GrammarBadge>Grammar</GrammarBadge>
<VocabularyBadge>Vocabulary</VocabularyBadge>
<SpeakingBadge>Speaking</SpeakingBadge>
```

## Category Types

### Content Categories

```tsx
<CategoryBadge category="grammar">Grammar</CategoryBadge>        // Sage Green
<CategoryBadge category="vocabulary">Vocabulary</CategoryBadge>  // Teal
<CategoryBadge category="speaking">Speaking</CategoryBadge>      // Coral
<CategoryBadge category="listening">Listening</CategoryBadge>    // Sky Blue
<CategoryBadge category="reading">Reading</CategoryBadge>        // Lavender
<CategoryBadge category="writing">Writing</CategoryBadge>        // Lavender
<CategoryBadge category="culture">Culture</CategoryBadge>        // Terracotta
<CategoryBadge category="community">Community</CategoryBadge>    // Rose
<CategoryBadge category="premium">Premium</CategoryBadge>        // Indigo
```

### Difficulty Levels

```tsx
<CategoryBadge difficulty="beginner">Beginner A1</CategoryBadge>        // Army Green
<CategoryBadge difficulty="intermediate">Intermediate B1</CategoryBadge> // Amber
<CategoryBadge difficulty="advanced">Advanced C1</CategoryBadge>         // Marigold

// Convenience components
<BeginnerBadge>Beginner</BeginnerBadge>
<IntermediateBadge>Intermediate</IntermediateBadge>
<AdvancedBadge>Advanced</AdvancedBadge>
```

### Regional Labels

```tsx
<CategoryBadge region="east-africa">East Africa</CategoryBadge>       // Sky Blue
<CategoryBadge region="west-africa">West Africa</CategoryBadge>       // Marigold
<CategoryBadge region="southern-africa">Southern Africa</CategoryBadge> // Sage
<CategoryBadge region="north-africa">North Africa</CategoryBadge>     // Amber
<CategoryBadge region="central-africa">Central Africa</CategoryBadge> // Teal
```

## Real-World Examples

### Phrase Card with Multiple Labels

```tsx
<Card className="border-l-4 border-primary">
  <CardHeader>
    <div className="flex items-center gap-2 mb-2">
      {/* Language */}
      <CategoryBadge category="culture" icon="🇿🇼">
        Shona
      </CategoryBadge>

      {/* Difficulty */}
      <BeginnerBadge>Beginner A1</BeginnerBadge>

      {/* Content Type */}
      <SpeakingBadge>Speaking</SpeakingBadge>
    </div>

    <CardTitle className="font-serif text-xl">
      Mangwanani
    </CardTitle>
    <CardDescription>Good morning</CardDescription>
  </CardHeader>
</Card>
```

### Category Filter Buttons

```tsx
<div className="flex flex-wrap gap-2">
  <Button
    variant="outline"
    className="border-sage-300 text-sage-800 hover:bg-sage-50"
  >
    <GrammarBadge>Grammar</GrammarBadge>
  </Button>

  <Button
    variant="outline"
    className="border-teal-300 text-teal-800 hover:bg-teal-50"
  >
    <VocabularyBadge>Vocabulary</VocabularyBadge>
  </Button>

  <Button
    variant="outline"
    className="border-coral-300 text-coral-800 hover:bg-coral-50"
  >
    <SpeakingBadge>Speaking</SpeakingBadge>
  </Button>
</div>
```

### Regional Language Showcase

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {/* East Africa */}
  <div className="p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
    <h4 className="font-serif text-sky-800 mb-2">East Africa</h4>
    <div className="flex flex-wrap gap-2">
      <CategoryBadge region="east-africa" icon="🇰🇪">Swahili</CategoryBadge>
      <CategoryBadge region="east-africa" icon="🇪🇹">Amharic</CategoryBadge>
    </div>
  </div>

  {/* Southern Africa */}
  <div className="p-4 rounded-lg bg-sage-50 border-2 border-sage-200">
    <h4 className="font-serif text-sage-800 mb-2">Southern Africa</h4>
    <div className="flex flex-wrap gap-2">
      <CategoryBadge region="southern-africa" icon="🇿🇼">Shona</CategoryBadge>
      <CategoryBadge region="southern-africa" icon="🇿🇦">Zulu</CategoryBadge>
    </div>
  </div>

  {/* West Africa */}
  <div className="p-4 rounded-lg bg-marigold-50 border-2 border-marigold-200">
    <h4 className="font-serif text-marigold-800 mb-2">West Africa</h4>
    <div className="flex flex-wrap gap-2">
      <CategoryBadge region="west-africa" icon="🇳🇬">Yoruba</CategoryBadge>
      <CategoryBadge region="west-africa" icon="🇬🇭">Twi</CategoryBadge>
    </div>
  </div>
</div>
```

### Learning Path Progress

```tsx
<Card>
  <CardHeader>
    <CardTitle>Your Learning Path</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Beginner - Completed */}
    <div className="flex items-center justify-between">
      <BeginnerBadge>Beginner</BeginnerBadge>
      <Progress value={100} variant="success" className="w-32" />
      <Badge variant="success">Completed</Badge>
    </div>

    {/* Intermediate - In Progress */}
    <div className="flex items-center justify-between">
      <IntermediateBadge>Intermediate</IntermediateBadge>
      <Progress value={65} className="w-32" />
      <Badge>65%</Badge>
    </div>

    {/* Advanced - Locked */}
    <div className="flex items-center justify-between opacity-50">
      <AdvancedBadge>Advanced</AdvancedBadge>
      <Progress value={0} className="w-32" />
      <Badge variant="outline">Locked</Badge>
    </div>
  </CardContent>
</Card>
```

## Direct Tailwind Usage (Without Component)

If you need to use the colors directly without the CategoryBadge component:

```tsx
// Using Tailwind classes directly
<Badge className="bg-sage-100 text-sage-800 border border-sage-300">
  Grammar
</Badge>

// With dark mode support
<Badge className="bg-sage-100 text-sage-800 border border-sage-300 dark:bg-sage-900 dark:text-sage-100 dark:border-sage-700">
  Grammar
</Badge>

// Using in buttons
<Button className="bg-coral-100 text-coral-800 hover:bg-coral-200">
  Start Speaking Practice
</Button>

// Progress bars with category colors
<div className="w-full bg-teal-100 rounded-full h-2">
  <div className="bg-teal-600 h-2 rounded-full" style={{ width: '75%' }} />
</div>
```

## Color Reference

| Category | Primary Use | Light BG | Text | Border |
|----------|-------------|----------|------|--------|
| **Terracotta** | Culture & Heritage | `terracotta-100` | `terracotta-800` | `terracotta-300` |
| **Coral** | Speaking & Pronunciation | `coral-100` | `coral-800` | `coral-300` |
| **Amber** | Intermediate Level | `amber-100` | `amber-800` | `amber-300` |
| **Sage** | Grammar & Structure | `sage-100` | `sage-800` | `sage-300` |
| **Sky** | Listening & Comprehension | `sky-100` | `sky-800` | `sky-300` |
| **Lavender** | Reading & Writing | `lavender-100` | `lavender-800` | `lavender-300` |
| **Teal** | Vocabulary & Words | `teal-100` | `teal-800` | `teal-300` |
| **Marigold** | Advanced Level | `marigold-100` | `marigold-800` | `marigold-300` |
| **Rose** | Community & Social | `rose-100` | `rose-800` | `rose-300` |
| **Indigo** | Premium Features | `indigo-100` | `indigo-800` | `indigo-300` |

## Accessibility

All color combinations meet **WCAG 2.1 AA** standards:
- Light backgrounds (100) with dark text (800): **6.2:1 minimum contrast**
- All interactive elements: **48px minimum touch targets**
- Color is never the sole indicator of meaning

## Best Practices

### DO
- ✅ Use 100-level backgrounds with 800-level text
- ✅ Add borders (300-level) for extra definition
- ✅ Test in both light and dark modes
- ✅ Provide text labels, not just color coding
- ✅ Group related categories together
- ✅ Limit to 3-4 colors per view for clarity

### DON'T
- ❌ Use color alone to convey information
- ❌ Use 50-level with 600-level (may fail contrast)
- ❌ Mix too many colors in one view
- ❌ Forget to test with colorblind simulators
- ❌ Override the established color meanings

## TypeScript Types

```typescript
import type { CategoryType, DifficultyType, RegionType } from '@/components/ui/category-badge'

// Use in your components
interface PhraseCardProps {
  category: CategoryType
  difficulty: DifficultyType
  region?: RegionType
}
```

## Implementation Checklist

Phase 1: Core Categories
- [x] Add colors to Tailwind config
- [x] Create CategoryBadge component
- [ ] Update phrase cards with category badges
- [ ] Add category filters to search

Phase 2: Difficulty Levels
- [ ] Add difficulty badges to phrases
- [ ] Update learning path UI
- [ ] Add difficulty-based filtering

Phase 3: Regional Labels
- [ ] Add regional badges for languages
- [ ] Create regional showcases
- [ ] Update language selection UI

Phase 4: Advanced Features
- [ ] Add premium badges
- [ ] Community feature labels
- [ ] Reading/writing indicators

---

**Need Help?**
- See [NYUCHI_LINGO_SECONDARY_COLORS.md](../brand/NYUCHI_LINGO_SECONDARY_COLORS.md) for full color specifications
- Check [CategoryBadge component](../components/ui/category-badge.tsx) for implementation details
- All colors are WCAG 2.1 AA compliant ✅
